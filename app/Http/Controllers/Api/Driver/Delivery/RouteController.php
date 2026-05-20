<?php

namespace App\Http\Controllers\Api\Driver\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Delivery\Delivery;
use App\Models\Delivery\ProofOfDelivery;
use App\Models\Delivery\Route;
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
        $route = Route::where('driver_id', $user->id)
            ->whereDate('date', now()->toDateString())
            ->whereIn('status', ['in_progress', 'optimized'])
            ->first();

        // 2. Roll-over: fetch active route from previous days
        if (!$route) {
            $route = Route::where('driver_id', $user->id)
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
                'delivery' => [
                    'id' => $delivery->id,
                    'tracking_number' => $delivery->tracking_number,
                    'weight_kg' => (float) $delivery->weight_kg,
                    'dropoff_address' => $delivery->dropoff_address,
                    'lng' => $coords ? (float) $coords->lng : null,
                    'lat' => $coords ? (float) $coords->lat : null,
                    'status' => $delivery->status,
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
            $delivery->started_at = now();
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
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $filename = Str::ulid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('proof_of_deliveries', $filename, 'public');

                ProofOfDelivery::create([
                    'delivery_id' => $delivery->id,
                    'photo_path' => Storage::url($path),
                    'notes' => $request->input('notes'),
                ]);
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
            'reason_code' => 'required|string|in:customer_unreachable,address_not_found,refused_payment,refused_delivery,damaged_package,rescheduled,other',
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

            // Store delivery issue exception record
            DB::table('delivery_issues')->insert([
                'id' => (string) Str::ulid(),
                'delivery_id' => $delivery->id,
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

        // Retrieve alerts published in the last 24 hours to keep the map clean and snappy
        $alerts = DB::select(
            "SELECT id, description, type, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat, created_at 
             FROM road_alerts 
             WHERE company_id = ? AND created_at >= NOW() - INTERVAL '24 HOURS'
             ORDER BY created_at DESC",
            [$companyId]
        );

        return response()->json([
            'data' => $alerts
        ]);
    }
}
