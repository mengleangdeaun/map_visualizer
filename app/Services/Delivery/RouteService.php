<?php

namespace App\Services\Delivery;

use App\Events\Delivery\RouteAssignedToDriver;
use App\Models\Delivery\Delivery;
use App\Models\Delivery\Route;
use App\Models\Delivery\RouteStop;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RouteService
{
    // Public OSRM demo server — replace with self-hosted if needed
    private const OSRM_BASE = 'https://router.project-osrm.org';

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public function list(array $params): LengthAwarePaginator
    {
        $perPage   = $params['per_page']   ?? 15;
        $companyId = $params['company_id'] ?? null;
        $driverId  = $params['driver_id']  ?? null;
        $date      = $params['date']       ?? null;
        $status    = $params['status']     ?? null;

        $query = Route::with(['driver', 'hub', 'stops.delivery.order.customer']);

        if ($companyId) $query->where('company_id', $companyId);
        if ($driverId)  $query->where('driver_id', $driverId);
        if ($date)      $query->whereDate('date', $date);
        if ($status)    $query->where('status', $status);

        return $query->latest()->paginate($perPage);
    }

    public function findById(string $id, ?string $companyId = null): Route
    {
        $query = Route::with(['driver', 'hub', 'stops' => function ($q) {
            $q->orderBy('sequence_number')->with(['delivery' => function ($dq) {
                $dq->select('*')
                   ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_latitude')
                   ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_longitude')
                   ->with('order.customer');
            }]);
        }]);

        if ($companyId) $query->where('company_id', $companyId);

        return $query->findOrFail($id);
    }

    public function create(array $data): Route
    {
        return Route::create($data);
    }

    public function update(Route $route, array $data): Route
    {
        $wasPublished = $route->status !== 'optimized' && ($data['status'] ?? null) === 'in_progress';

        $route->update($data);

        // Synchronize driver_id and statuses down to deliveries
        $this->syncStopsToDeliveries($route);

        // Broadcast to driver when route transitions to in_progress (published)
        if ($wasPublished && $route->driver_id) {
            $route->refresh();
            event(new RouteAssignedToDriver($route));
        }

        return $this->findById($route->id, $route->company_id);
    }

    public function delete(Route $route): bool
    {
        return DB::transaction(function () use ($route) {
            $route->stops()->delete();
            $route->delete();
            return true;
        });
    }

    // ── Stop Management ───────────────────────────────────────────────────────

    /**
     * Add deliveries to the route as stops.
     * After adding, sequences and OSRM data are recomputed.
     */
    public function addDeliveries(Route $route, array $deliveryIds): Route
    {
        return DB::transaction(function () use ($route, $deliveryIds) {
            foreach ($deliveryIds as $deliveryId) {
                // Avoid duplicate stops — silently skip
                if (RouteStop::where('route_id', $route->id)->where('delivery_id', $deliveryId)->exists()) {
                    continue;
                }

                RouteStop::create([
                    'route_id'        => $route->id,
                    'delivery_id'     => $deliveryId,
                    'sequence_number' => $route->stops()->count() + 1, // Temporary, overwritten by optimize
                    'status'          => 'pending',
                ]);
            }

            $this->syncStats($route);
            $this->syncStopsToDeliveries($route);

            return $this->findById($route->id, $route->company_id);
        });
    }

    /**
     * Remove a single stop from the route and resequence.
     */
    public function removeStop(RouteStop $stop): Route
    {
        return DB::transaction(function () use ($stop) {
            $routeId   = $stop->route_id;
            $companyId = $stop->route->company_id;

            $stop->delete();

            // Resequence remaining stops
            $remaining = RouteStop::where('route_id', $routeId)->orderBy('sequence_number')->get();
            foreach ($remaining as $i => $s) {
                $s->update(['sequence_number' => $i + 1]);
            }

            $route = Route::find($routeId);
            $this->syncStats($route);
            $this->syncStopsToDeliveries($route);

            return $this->findById($routeId, $companyId);
        });
    }

    /**
     * Manually reorder stops by providing the desired delivery IDs in order.
     * Does not re-run OSRM optimization — this is an explicit admin override.
     */
    public function reorder(Route $route, array $orderedDeliveryIds): Route
    {
        return DB::transaction(function () use ($route, $orderedDeliveryIds) {
            foreach ($orderedDeliveryIds as $seq => $deliveryId) {
                RouteStop::where('route_id', $route->id)
                         ->where('delivery_id', $deliveryId)
                         ->update(['sequence_number' => $seq + 1]);
            }

            $this->syncStopsToDeliveries($route);

            return $this->findById($route->id, $route->company_id);
        });
    }

    // ── Optimization ──────────────────────────────────────────────────────────

    /**
     * Full optimization pipeline:
     * 1. Nearest-neighbor heuristic → determines visit sequence
     * 2. OSRM Route API → enriches each leg with road distance, duration, geometry
     * 3. Saves all data and marks route as 'optimized'
     */
    public function optimize(Route $route): Route
    {
        return DB::transaction(function () use ($route) {
            // Load all stops with their delivery coords
            $stops = RouteStop::where('route_id', $route->id)
                ->with(['delivery' => function ($q) {
                    $q->selectRaw('*, ST_Y(dropoff_location::geometry) as lat, ST_X(dropoff_location::geometry) as lng');
                }])
                ->get();

            if ($stops->isEmpty()) {
                return $this->findById($route->id, $route->company_id);
            }

            // Filter to stops with valid coordinates
            $stopsWithCoords = $stops->filter(fn($s) =>
                $s->delivery && $s->delivery->lat && $s->delivery->lng
            )->values();

            if ($stopsWithCoords->isEmpty()) {
                return $this->findById($route->id, $route->company_id);
            }

            // Step 1: Nearest-neighbor heuristic to determine sequence
            $ordered = $this->nearestNeighborSequence($stopsWithCoords, $route);

            // Step 2: OSRM route call for real road distances + leg geometries
            $this->enrichWithOsrm($ordered, $route);

            // Mark as optimized
            $route->update(['status' => 'optimized']);

            return $this->findById($route->id, $route->company_id);
        });
    }

    /**
     * Nearest-neighbor greedy heuristic.
     * Start from hub (or first stop if no hub), repeatedly pick the closest unvisited stop.
     * Returns stops in visit order with sequence_number updated.
     */
    private function nearestNeighborSequence($stops, Route $route): \Illuminate\Support\Collection
    {
        // Origin: hub coordinates, or centroid fallback
        $originLat = null;
        $originLng = null;

        if ($route->hub_id) {
            $hub = DB::selectOne(
                "SELECT ST_Y(coordinates::geometry) as lat, ST_X(coordinates::geometry) as lng FROM locations WHERE id = ?",
                [$route->hub_id]
            );
            if ($hub) {
                $originLat = (float) $hub->lat;
                $originLng = (float) $hub->lng;
            }
        }

        // Fall back to first stop's coordinates if no hub set
        if (!$originLat && $stops->isNotEmpty()) {
            $first = $stops->first();
            $originLat = (float) $first->delivery->lat;
            $originLng = (float) $first->delivery->lng;
        }

        $unvisited = $stops->toArray();
        $ordered   = [];
        $curLat    = $originLat;
        $curLng    = $originLng;

        while (!empty($unvisited)) {
            $nearest      = null;
            $nearestDist  = PHP_FLOAT_MAX;
            $nearestIndex = 0;

            foreach ($unvisited as $i => $stop) {
                $stopLat = (float) $stop['delivery']['lat'];
                $stopLng = (float) $stop['delivery']['lng'];
                $dist    = $this->haversine($curLat, $curLng, $stopLat, $stopLng);

                if ($dist < $nearestDist) {
                    $nearestDist  = $dist;
                    $nearest      = $stop;
                    $nearestIndex = $i;
                }
            }

            $ordered[] = $nearest;
            $curLat    = (float) $nearest['delivery']['lat'];
            $curLng    = (float) $nearest['delivery']['lng'];
            array_splice($unvisited, $nearestIndex, 1);
        }

        // Persist the computed sequence
        foreach ($ordered as $seq => $stopArr) {
            RouteStop::where('id', $stopArr['id'])->update(['sequence_number' => $seq + 1]);
        }

        // Synchronize sequence numbers and statuses to deliveries
        $this->syncStopsToDeliveries($route);

        // Return as fresh Eloquent collection for OSRM enrichment
        return RouteStop::where('route_id', $route->id)
            ->with(['delivery' => function ($q) {
                $q->selectRaw('*, ST_Y(dropoff_location::geometry) as lat, ST_X(dropoff_location::geometry) as lng');
            }])
            ->orderBy('sequence_number')
            ->get();
    }

    /**
     * Calls OSRM /route API for the full ordered sequence and stores
     * per-leg distance (km), duration (min), and GeoJSON geometry.
     */
    private function enrichWithOsrm(\Illuminate\Support\Collection $orderedStops, Route $route): void
    {
        // Build coordinate string: lng,lat;lng,lat;...
        $coords = $orderedStops->map(function ($stop) {
            $lng = (float) $stop->delivery->lng;
            $lat = (float) $stop->delivery->lat;
            return "{$lng},{$lat}";
        })->implode(';');

        if (!$coords) return;

        try {
            $response = Http::timeout(10)->get(
                self::OSRM_BASE . "/route/v1/driving/{$coords}",
                [
                    'overview'     => 'full',
                    'geometries'   => 'geojson',
                    'steps'        => 'false',
                    'annotations'  => 'false',
                ]
            );

            if (!$response->ok()) {
                Log::warning('OSRM route enrichment failed', ['status' => $response->status()]);
                return;
            }

            $data  = $response->json();
            $route_data = $data['routes'][0] ?? null;

            if (!$route_data) return;

            $legs = $route_data['legs'] ?? [];

            // Update each stop's leg data (leg[i] = path FROM stop[i] TO stop[i+1])
            // First stop: leg from hub to stop[0] — we store leg_distance for the incoming leg
            // We store it on the destination stop (stop i+1)
            foreach ($orderedStops as $idx => $stop) {
                if ($idx === 0) {
                    // First stop has no prior leg — clear leg data
                    $stop->update([
                        'leg_distance_km'  => null,
                        'leg_duration_min' => null,
                        'leg_geometry'     => null,
                    ]);
                    continue;
                }

                $leg = $legs[$idx - 1] ?? null;
                if (!$leg) continue;

                $geometry = $route_data['geometry'] ?? null; // Full path; individual leg geometry not split by OSRM without steps
                // Store per-leg stats (full geometry stored on route level via stats update)
                $stop->update([
                    'leg_distance_km'  => round(($leg['distance'] ?? 0) / 1000, 2),
                    'leg_duration_min' => round(($leg['duration'] ?? 0) / 60),
                ]);
            }

            // Update route-level totals and store full geometry on route
            $totalDistance = round(($route_data['distance'] ?? 0) / 1000, 2);
            $totalDuration = round(($route_data['duration'] ?? 0) / 60);

            $route->update([
                'estimated_distance_km'  => $totalDistance,
                'estimated_duration_min' => $totalDuration,
            ]);
        } catch (ConnectionException $e) {
            Log::warning('OSRM connection error during route enrichment', ['error' => $e->getMessage()]);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Haversine great-circle distance in km.
     */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371; // Earth radius in km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Recalculate and persist stop_count and total_weight_kg on the route.
     */
    private function syncStats(Route $route): void
    {
        $stops = RouteStop::where('route_id', $route->id)
            ->with('delivery')
            ->get();

        $route->update([
            'stop_count'      => $stops->count(),
            'total_weight_kg' => $stops->sum(fn($s) => (float) ($s->delivery->weight_kg ?? 0)),
        ]);
    }

    /**
     * Synchronizes sequence_number, route_status, and driver_id 
     * from the route_stops table directly to the deliveries table.
     */
    private function syncStopsToDeliveries(Route $route): void
    {
        $stops = RouteStop::where('route_id', $route->id)->get();
        
        foreach ($stops as $stop) {
            Delivery::where('id', $stop->delivery_id)->update([
                'sequence_number' => $stop->sequence_number,
                'route_status'    => $stop->status,
                'driver_id'       => $route->driver_id,
            ]);
        }
    }
}
