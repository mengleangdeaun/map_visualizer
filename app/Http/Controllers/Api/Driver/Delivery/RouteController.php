<?php

namespace App\Http\Controllers\Api\Driver\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Delivery\Delivery;
use App\Models\Delivery\ProofOfDelivery;
use App\Models\Delivery\Route as DeliveryRoute;
use App\Models\Delivery\RouteStop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RouteController extends Controller
{
    /**
     * Get the active route assigned to the current driver for today.
     */
    public function getActiveRoute(Request $request)
    {
        $user = $request->user();
        
        // 1. Retrieve the active route for today assigned to this driver
        $route = DeliveryRoute::where('driver_id', $user->id)
            ->whereDate('date', now()->toDateString())
            ->whereIn('status', ['in_progress', 'optimized'])
            ->first();

        // 2. Roll-over: fetch active route from previous days
        if (!$route) {
            $route = DeliveryRoute::where('driver_id', $user->id)
                ->where('status', 'in_progress')
                ->latest('date')
                ->first();
        }

        // Load route stops map if route exists
        $routeStopsMap = [];
        $routeStopDeliveryIds = [];
        if ($route) {
            $routeStops = RouteStop::where('route_id', $route->id)->get();
            foreach ($routeStops as $stop) {
                $routeStopsMap[$stop->delivery_id] = [
                    'sequence_number' => $stop->sequence_number,
                    'status'          => $stop->status,
                    'eta'             => $stop->eta,
                    'arrived_at'      => $stop->arrived_at,
                    'completed_at'    => $stop->completed_at,
                ];
            }
            $routeStopDeliveryIds = array_keys($routeStopsMap);
        }

        // Fetch all deliveries assigned to this driver that are active or in the route stops list
        $deliveries = Delivery::where('driver_id', $user->id)
            ->where(function ($query) use ($routeStopDeliveryIds) {
                $query->whereIn('route_status', ['pending', 'arrived'])
                      ->orWhereIn('id', $routeStopDeliveryIds);
            })
            ->get();

        if ($deliveries->isEmpty()) {
            return response()->json([
                'message' => 'No active route found.',
                'data' => null
            ]);
        }

        $stops = $deliveries->map(function ($delivery) use ($routeStopsMap) {
            $coords = DB::selectOne(
                "SELECT ST_X(dropoff_location::geometry) as lng, ST_Y(dropoff_location::geometry) as lat FROM deliveries WHERE id = ?",
                [$delivery->id]
            );

            $order = $delivery->order;
            $customer = $order ? $order->customer : null;
            $items = $order ? $order->items : collect();

            if (isset($routeStopsMap[$delivery->id])) {
                $seq = $routeStopsMap[$delivery->id]['sequence_number'];
                $status = $routeStopsMap[$delivery->id]['status'];
                $eta = $routeStopsMap[$delivery->id]['eta'];
            } else {
                $seq = 999; // Temporary marker for standalone deliveries
                $status = $delivery->route_status;
                $eta = $delivery->eta;
            }

            return [
                'id' => $delivery->id,
                'sequence_number' => $seq,
                'eta' => $eta ? $eta->toIso8601String() : null,
                'status' => $status,
                'arrived_at' => (isset($routeStopsMap[$delivery->id]) && $routeStopsMap[$delivery->id]['arrived_at']) 
                    ? $routeStopsMap[$delivery->id]['arrived_at']->toIso8601String() 
                    : null,
                'completed_at' => (isset($routeStopsMap[$delivery->id]) && $routeStopsMap[$delivery->id]['completed_at']) 
                    ? $routeStopsMap[$delivery->id]['completed_at']->toIso8601String() 
                    : null,
                'delivery' => [
                    'id' => $delivery->id,
                    'tracking_number' => $delivery->tracking_number,
                    'weight_kg' => (float) $delivery->weight_kg,
                    'dropoff_address' => $delivery->dropoff_address,
                    'lng' => $coords ? (float) $coords->lng : null,
                    'lat' => $coords ? (float) $coords->lat : null,
                    'status' => $delivery->status,
                    'started_at' => $delivery->started_at ? $delivery->started_at->toIso8601String() : null,
                    'completed_at' => $delivery->completed_at ? $delivery->completed_at->toIso8601String() : null,
                    'scheduled_at' => $delivery->scheduled_at ? $delivery->scheduled_at->toIso8601String() : null,
                    'order' => $order ? [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'total_amount' => (float) $order->grand_total,
                        'amount_due_cod' => (float) ($order->amount_due_cod !== null ? $order->amount_due_cod : ($order->payment_method === 'cod' ? $order->balance_amount : 0.0)),
                        'payment_method' => $order->payment_method,
                        'payment_status' => $order->payment_status,
                        'customer' => $customer ? [
                            'id' => $customer->id,
                            'name' => $customer->name,
                            'phone' => $customer->phone,
                        ] : null,
                        'items' => $items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'product_name' => $item->product_name,
                                'sku' => $item->sku,
                                'quantity' => $item->quantity,
                            ];
                        })
                    ] : null
                ]
            ];
        });

        // Separate and resequence stops dynamically
        $routeStops = $stops->filter(fn($s) => $s['sequence_number'] !== 999)->sortBy('sequence_number')->values();
        $standaloneStops = $stops->filter(fn($s) => $s['sequence_number'] === 999)->values();

        $finalStops = collect();
        $routeStopsCount = $routeStops->count();

        foreach ($routeStops as $s) {
            $finalStops->push($s);
        }

        foreach ($standaloneStops as $idx => $s) {
            $s['sequence_number'] = $routeStopsCount + $idx + 1;
            $finalStops->push($s);
        }

        // Calculate cash to remit
        $cashToRemit = $finalStops->sum(function ($s) {
            $order = $s['delivery']['order'] ?? null;
            if ($order && $order['payment_method'] === 'cod') {
                return (float) $order['amount_due_cod'];
            }
            return 0.0;
        });

        if ($route) {
            $routeId = $route->id;
            $routeStatus = $route->status;
            $routeDate = $route->date->toDateString();
        } else {
            $routeId = 'route_' . $user->id . '_' . now()->toDateString();
            $hasArrivedOrCompleted = $deliveries->contains(fn($d) => in_array($d->route_status, ['arrived', 'completed']));
            $allDone = $deliveries->every(fn($d) => in_array($d->route_status, ['completed', 'skipped']));
            $routeStatus = $allDone ? 'completed' : 'in_progress';
            $routeDate = now()->toDateString();
        }

        return response()->json([
            'data' => [
                'id' => $routeId,
                'status' => $routeStatus,
                'cash_to_remit' => (float) $cashToRemit,
                'date' => $routeDate,
                'stops' => $finalStops->toArray()
            ]
        ]);
    }

    /**
     * Mark a delivery stop as "started" (start delivery route).
     */
    public function start(Request $request, $id)
    {
        $request->validate([
            'latitude'  => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $delivery = Delivery::findOrFail($id);

        // Verify driver matching
        if ($delivery->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        // Fetch stop destination location dropoff coordinate
        $coords = DB::selectOne(
            "SELECT ST_X(dropoff_location::geometry) as lng, ST_Y(dropoff_location::geometry) as lat FROM deliveries WHERE id = ?",
            [$delivery->id]
        );

        $actual_dist = null;
        $actual_dur = null;
        $actual_geom = null;

        if ($request->filled('latitude') && $request->filled('longitude') && $coords && $coords->lng && $coords->lat) {
            $startLat = (float) $request->input('latitude');
            $startLng = (float) $request->input('longitude');
            $destLat = (float) $coords->lat;
            $destLng = (float) $coords->lng;

            try {
                $response = \Illuminate\Support\Facades\Http::timeout(5)->get(
                    "http://127.0.0.1:5000/route/v1/driving/{$startLng},{$startLat};{$destLng},{$destLat}",
                    [
                        'overview'   => 'full',
                        'geometries' => 'geojson',
                    ]
                );

                if ($response->ok()) {
                    $data = $response->json();
                    $route_data = $data['routes'][0] ?? null;
                    if ($route_data) {
                        $actual_dist = round(($route_data['distance'] ?? 0) / 1000, 2);
                        $actual_dur = round(($route_data['duration'] ?? 0) / 60);
                        $actual_geom = $route_data['geometry'] ?? null;
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('OSRM dynamic start route call failed', ['error' => $e->getMessage()]);
            }
        }

        DB::transaction(function () use ($delivery, $request, $actual_dist, $actual_dur, $actual_geom) {
            $delivery->status = 'out_for_delivery';
            if (!$delivery->started_at) {
                $delivery->started_at = now();
            }
            $delivery->save();

            $actualStartLocation = null;
            if ($request->filled('latitude') && $request->filled('longitude')) {
                $lat = (float) $request->input('latitude');
                $lng = (float) $request->input('longitude');
                $actualStartLocation = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            }

            // Synchronize with RouteStop row and store actual route tracking fields
            RouteStop::where('delivery_id', $delivery->id)->update([
                'status'                  => 'in_transit',
                'started_at'              => now(),
                'actual_start_location'   => $actualStartLocation,
                'actual_leg_distance_km'  => $actual_dist,
                'actual_leg_duration_min' => $actual_dur,
                'actual_leg_geometry'     => $actual_geom,
            ]);
        });

        // Retrieve the updated RouteStop
        $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();

        return response()->json([
            'message' => 'Delivery route started successfully.',
            'data' => [
                'stop_status'             => 'in_transit',
                'delivery_status'         => $delivery->status,
                'started_at'              => $routeStop?->started_at ? $routeStop->started_at->toIso8601String() : null,
                'actual_leg_distance_km'  => $routeStop?->actual_leg_distance_km ? (float) $routeStop->actual_leg_distance_km : null,
                'actual_leg_duration_min' => $routeStop?->actual_leg_duration_min ? (int) $routeStop->actual_leg_duration_min : null,
                'actual_leg_geometry'     => $routeStop?->actual_leg_geometry,
            ]
        ]);
    }

    /**
     * Mark a delivery stop as "arrived".
     */
    public function arrive(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);

        // Verify driver matching
        if ($delivery->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        DB::transaction(function () use ($delivery) {
            $delivery->route_status = 'arrived';
            $delivery->status = 'out_for_delivery';
            if (!$delivery->started_at) {
                $delivery->started_at = now();
            }
            $delivery->save();

            // Synchronize with RouteStop row
            RouteStop::where('delivery_id', $delivery->id)->update([
                'status' => 'arrived',
                'arrived_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Arrived at stop successfully.',
            'data' => ['stop_status' => 'arrived', 'delivery_status' => $delivery->status]
        ]);
    }

    /**
     * Mark a delivery stop as "completed" (delivered successfully).
     */
    public function complete(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
            'photo' => 'nullable|image|max:10240', // Max 10MB camera uploads
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $delivery = Delivery::findOrFail($id);

        if ($delivery->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        $order = $delivery->order;

        DB::transaction(function () use ($request, $delivery, $order) {
            // Update statuses
            $delivery->route_status = 'completed';
            $delivery->status = 'delivered';
            $delivery->completed_at = now();
            $delivery->save();

            // Synchronize with RouteStop row
            RouteStop::where('delivery_id', $delivery->id)->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            if ($order) {
                $order->status = 'completed';
                $order->payment_status = 'paid';
                $order->paid_amount = $order->grand_total;
                $order->balance_amount = 0;
                $order->save();
            }

            // Save photo file path if provided
            $photoUrl = null;
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $filename = Str::ulid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('proof_of_deliveries', $filename, 'public');
                $photoUrl = Storage::url($path);
            }

            $receiverName = $order?->customer?->name;

            $capturedLocation = null;
            if ($request->filled('latitude') && $request->filled('longitude')) {
                $lat = (float) $request->input('latitude');
                $lng = (float) $request->input('longitude');
                $capturedLocation = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            }

            ProofOfDelivery::create([
                'delivery_id' => $delivery->id,
                'driver_id' => $request->user()->id,
                'photo_url' => $photoUrl,
                'notes' => $request->input('notes'),
                'receiver_name' => $receiverName,
                'captured_location' => $capturedLocation,
            ]);

            // Check if there is an associated Route and if all its stops are now resolved
            $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
            if ($routeStop && $routeStop->route_id) {
                $hasActiveStops = RouteStop::where('route_id', $routeStop->route_id)
                    ->whereNotIn('status', ['completed', 'skipped'])
                    ->exists();

                if (!$hasActiveStops) {
                    DeliveryRoute::where('id', $routeStop->route_id)->update([
                        'status' => 'completed',
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Stop resolved as delivered successfully.',
            'data' => ['stop_status' => 'completed', 'delivery_status' => $delivery->status]
        ]);
    }

    /**
     * Mark a delivery stop as "failed" (skipped / delivery issue).
     */
    public function fail(Request $request, $id)
    {
        $request->validate([
            'reason_code' => 'required|string|in:customer_unreachable,address_not_found,refused_payment,refused_delivery,damaged_package,lost_package,rescheduled,other',
            'notes' => 'nullable|string|max:1000',
        ]);

        $delivery = Delivery::findOrFail($id);

        if ($delivery->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        DB::transaction(function () use ($request, $delivery) {
            $reasonCode = $request->input('reason_code');
            $delivery->route_status = 'skipped';
            $delivery->status = $reasonCode === 'rescheduled' ? 'rescheduled' : 'failed';
            $delivery->completed_at = now();
            $delivery->save();

            // Synchronize with RouteStop row
            RouteStop::where('delivery_id', $delivery->id)->update([
                'status' => 'skipped',
                'completed_at' => now(),
            ]);

            // Check if there is an associated Route and if all its stops are now resolved
            $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
            if ($routeStop && $routeStop->route_id) {
                $hasActiveStops = RouteStop::where('route_id', $routeStop->route_id)
                    ->whereNotIn('status', ['completed', 'skipped'])
                    ->exists();

                if (!$hasActiveStops) {
                    DeliveryRoute::where('id', $routeStop->route_id)->update([
                        'status' => 'completed',
                    ]);
                }
            }

            // Store delivery issue exception record
            DB::table('delivery_issues')->insert([
                'id' => (string) Str::ulid(),
                'company_id' => $delivery->company_id,
                'delivery_id' => $delivery->id,
                'driver_id' => $request->user()->id,
                'issue_type' => $request->input('reason_code'),
                'description' => $request->input('notes') ?? 'Driver logged exception stop.',
                'reported_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Stop exception logged successfully.',
            'data' => ['stop_status' => 'skipped', 'delivery_status' => $delivery->status]
        ]);
    }

    /**
     * Get active roadblocks/alerts for PWA map visualization.
     */
    public function getRoadAlerts(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        if (!$companyId) {
            return response()->json(['message' => 'Unauthorized company scope.'], 403);
        }

        // Retrieve active alerts for the driver map (aligned with admin UI)
        $alerts = DB::select(
            "SELECT id, description, type, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat, created_at 
             FROM road_alerts 
             WHERE company_id = ?
             ORDER BY created_at DESC",
            [$companyId]
        );

        return response()->json([
            'data' => $alerts
        ]);
    }

    /**
     * Get paginated route and stop execution history for the driver.
     */
    public function getRouteHistory(Request $request)
    {
        $user = $request->user();
        
        $query = DeliveryRoute::where('driver_id', $user->id)
            ->with([
                'hub',
                'stops.delivery.order.customer'
            ]);

        // Filter by status if provided (default to completed or in_progress routes)
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        } else {
            $query->whereIn('status', ['completed', 'in_progress']);
        }

        // Filter by date if provided
        if ($request->filled('date')) {
            $query->whereDate('date', $request->input('date'));
        }

        $query->orderBy('date', 'desc')->orderBy('created_at', 'desc');

        $routes = $query->paginate(15);

        $items = collect($routes->items())->map(function ($route) {
            $stops = $route->stops->map(function ($stop) {
                $delivery = $stop->delivery;
                $order = $delivery?->order;
                $customer = $order?->customer;

                $coords = null;
                if ($delivery) {
                    $coords = DB::selectOne(
                        "SELECT ST_X(dropoff_location::geometry) as lng, ST_Y(dropoff_location::geometry) as lat FROM deliveries WHERE id = ?",
                        [$delivery->id]
                    );
                }

                $pod = null;
                if ($delivery) {
                    $podRecord = ProofOfDelivery::where('delivery_id', $delivery->id)->first();
                    if ($podRecord) {
                        $pod = [
                            'id' => $podRecord->id,
                            'photo_url' => $podRecord->photo_url,
                            'notes' => $podRecord->notes,
                            'receiver_name' => $podRecord->receiver_name,
                        ];
                    }
                }

                return [
                    'id' => $stop->id,
                    'sequence_number' => $stop->sequence_number,
                    'status' => $stop->status,
                    'eta' => $stop->eta ? $stop->eta->toIso8601String() : null,
                    'arrived_at' => $stop->arrived_at ? $stop->arrived_at->toIso8601String() : null,
                    'completed_at' => $stop->completed_at ? $stop->completed_at->toIso8601String() : null,
                    'notes' => $stop->notes,
                    'delivery' => $delivery ? [
                        'id' => $delivery->id,
                        'tracking_number' => $delivery->tracking_number,
                        'weight_kg' => (float) $delivery->weight_kg,
                        'dropoff_address' => $delivery->dropoff_address,
                        'status' => $delivery->status,
                        'started_at' => $delivery->started_at ? $delivery->started_at->toIso8601String() : null,
                        'completed_at' => $delivery->completed_at ? $delivery->completed_at->toIso8601String() : null,
                        'lng' => $coords ? (float) $coords->lng : null,
                        'lat' => $coords ? (float) $coords->lat : null,
                        'order' => $order ? [
                            'id' => $order->id,
                            'order_number' => $order->order_number,
                            'grand_total' => (float) $order->grand_total,
                            'amount_due_cod' => (float) ($order->amount_due_cod !== null ? $order->amount_due_cod : ($order->payment_method === 'cod' ? $order->balance_amount : 0.0)),
                            'payment_method' => $order->payment_method,
                            'payment_status' => $order->payment_status,
                            'customer' => $customer ? [
                                'id' => $customer->id,
                                'name' => $customer->name,
                                'phone' => $customer->phone,
                            ] : null,
                        ] : null,
                        'proof_of_delivery' => $pod,
                    ] : null,
                ];
            });

            return [
                'id' => $route->id,
                'date' => $route->date->toDateString(),
                'status' => $route->status,
                'notes' => $route->notes,
                'total_weight_kg' => (float) $route->total_weight_kg,
                'stop_count' => (int) $route->stop_count,
                'estimated_distance_km' => (float) $route->estimated_distance_km,
                'estimated_duration_min' => (int) $route->estimated_duration_min,
                'hub' => $route->hub ? [
                    'id' => $route->hub->id,
                    'code' => $route->hub->code,
                    'name' => $route->hub->name,
                ] : null,
                'stops' => $stops->toArray(),
            ];
        });

        return response()->json([
            'current_page' => $routes->currentPage(),
            'data' => $items,
            'first_page_url' => $routes->url(1),
            'from' => $routes->firstItem(),
            'last_page' => $routes->lastPage(),
            'last_page_url' => $routes->url($routes->lastPage()),
            'next_page_url' => $routes->nextPageUrl(),
            'path' => $routes->path(),
            'per_page' => $routes->perPage(),
            'prev_page_url' => $routes->previousPageUrl(),
            'to' => $routes->lastItem(),
            'total' => $routes->total(),
        ]);
    }
}
