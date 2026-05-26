<?php

namespace App\Http\Controllers\Api\Driver\Telemetry;

use App\Http\Controllers\Controller;
use App\Models\Driver\DriverTelemetry;
use App\Models\Fleet\Vehicle;
use App\Events\VehicleLocationUpdated;
use App\Jobs\ProcessDriverTelemetry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TelemetryController extends Controller
{
    /**
     * Calculate difference between two heading angles wrapping around 360 degrees.
     */
    private function getHeadingDifference(float $heading1, float $heading2): float
    {
        $diff = abs($heading1 - $heading2) % 360;
        return $diff > 180 ? 360 - $diff : $diff;
    }

    /**
     * Update driver's current location and broadcast to dispatchers.
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|numeric',
            'heading' => 'nullable|numeric',
        ]);

        $user = $request->user();
        
        // Find the vehicle assigned to this driver
        $vehicle = Vehicle::where('driver_id', $user->id)->first();

        // Prepare telemetry data payload
        $telemetryData = [
            'latitude' => (float) $validated['latitude'],
            'longitude' => (float) $validated['longitude'],
            'speed' => $validated['speed'] !== null ? (float) $validated['speed'] : 0.0,
            'heading' => $validated['heading'] !== null ? (float) $validated['heading'] : 0.0,
            'vehicle_id' => $vehicle?->id,
            'recorded_at' => now()->toIso8601String(),
        ];

        // 1. Store the hot telemetry in Valkey (Redis-compatible) cache
        // Cache the driver's latest position
        Cache::put("driver:telemetry:{$user->id}", $telemetryData, now()->addMinutes(30));

        // Cache the vehicle's latest position for fast vehicle map list retrieval
        if ($vehicle) {
            Cache::put("vehicle:telemetry:{$vehicle->id}", $telemetryData, now()->addMinutes(30));
        }

        // 2. Smart Historical Telemetry Filtering (Decide whether to persist to database history)
        $historyKey = "driver:telemetry:last_history_point:{$user->id}";
        $lastPoint = Cache::get($historyKey);

        $shouldPersist = false;

        if (!$lastPoint) {
            // Always persist the very first coordinate to establish starting point
            $shouldPersist = true;
        } else {
            $headingDiff = $this->getHeadingDifference((float) ($lastPoint['heading'] ?? 0.0), (float) ($telemetryData['heading'] ?? 0.0));
            $timePassed = now()->diffInSeconds(\Carbon\Carbon::parse($lastPoint['recorded_at']));
            $lastSpeed = (float) ($lastPoint['speed'] ?? 0.0);
            $currSpeed = (float) ($telemetryData['speed'] ?? 0.0);

            // A. CORNERING: Heading changed by more than 15 degrees and vehicle is moving
            if ($headingDiff >= 15.0 && $currSpeed > 2.0) {
                $shouldPersist = true;
            }
            // B. STOPPING/STARTING: Speed went to 0 (stopped), or speed became positive (started moving)
            elseif (($lastSpeed > 0.0 && $currSpeed == 0.0) || ($lastSpeed == 0.0 && $currSpeed > 0.0)) {
                $shouldPersist = true;
            }
            // C. HEARTBEAT: Safety fallback to prevent tracking gaps (3 minutes)
            elseif ($timePassed >= 180) {
                $shouldPersist = true;
            }
        }

        if ($shouldPersist) {
            ProcessDriverTelemetry::dispatch($user->id, $telemetryData);
            Cache::put($historyKey, $telemetryData, now()->addHours(2));
        }

        // 3. Broadcast real-time update for dispatchers
        if ($vehicle) {
            broadcast(new VehicleLocationUpdated(
                $validated['latitude'],
                $validated['longitude'],
                $validated['heading'] ?? 0,
                $validated['speed'] ?? 0,
                $vehicle->id,
                $vehicle->company_id
            ));
        }

        return response()->json([
            'message' => 'Location updated successfully',
            'vehicle_id' => $vehicle?->id
        ]);
    }

    /**
     * Return aggregated telemetry statistics for the driver's current shift.
     * Hot stats are served from cache; heavier aggregations from the DB.
     */
    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check whether the driver has a hot position in cache (proxy for active tracking)
        $hotTelemetry = Cache::get("driver:telemetry:{$user->id}");
        $isActive = $hotTelemetry !== null;

        if (!$isActive) {
            return response()->json(['active' => false, 'stats' => null]);
        }

        // Aggregate today's telemetry from the database
        $today = Carbon::today();

        $aggregate = DriverTelemetry::where('driver_id', $user->id)
            ->whereDate('recorded_at', $today)
            ->selectRaw(
                'COUNT(*) as points_recorded,
                 AVG(speed_kmh) as avg_speed_kmh,
                 MAX(speed_kmh) as max_speed_kmh,
                 MIN(recorded_at) as shift_started_at,
                 MAX(recorded_at) as last_persisted_at'
            )
            ->first();

        // Compute cumulative distance using PostGIS ST_Distance on consecutive points.
        // lag() (window function) must live in a subquery — PostgreSQL forbids nesting
        // window calls inside aggregate functions like SUM() directly.
        $distanceResult = DB::selectOne(
            "SELECT COALESCE(SUM(segment_m) / 1000, 0) AS distance_km
             FROM (
                 SELECT ST_Distance(
                     location::geography,
                     lag(location) OVER (ORDER BY recorded_at)::geography
                 ) AS segment_m
                 FROM driver_telemetry
                 WHERE driver_id = ?
                   AND DATE(recorded_at) = ?
                   AND location IS NOT NULL
             ) segments
             WHERE segment_m IS NOT NULL",
            [$user->id, $today->toDateString()]
        );

        $distanceKm = $distanceResult ? round((float) $distanceResult->distance_km, 2) : 0.0;

        // Compute shift duration in seconds (start of first point to now)
        $shiftStartedAt = $aggregate?->shift_started_at
            ? Carbon::parse($aggregate->shift_started_at)
            : null;
        $durationSeconds = $shiftStartedAt ? (int) $shiftStartedAt->diffInSeconds(now()) : 0;

        return response()->json([
            'active' => true,
            'stats' => [
                'distance_km'       => $distanceKm,
                'duration_seconds'  => $durationSeconds,
                'points_recorded'   => (int) ($aggregate?->points_recorded ?? 0),
                'avg_speed_kmh'     => round((float) ($aggregate?->avg_speed_kmh ?? 0)),
                'max_speed_kmh'     => (int) ($aggregate?->max_speed_kmh ?? 0),
                'last_persisted_at' => $aggregate?->last_persisted_at,
            ],
        ]);
    }
}
