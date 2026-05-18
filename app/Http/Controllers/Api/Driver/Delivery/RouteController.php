<?php

namespace App\Http\Controllers\Api\Driver\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Delivery\Route;
use App\Models\Delivery\RouteStop;
use App\Models\Delivery\Delivery;
use App\Models\Delivery\ProofOfDelivery;
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
        
        // Find today's route that is currently in_progress or optimized/draft
        $route = Route::where('driver_id', $user->id)
            ->whereIn('status', ['in_progress', 'optimized', 'draft'])
            ->orderBy('date', 'desc')
            ->first();

        if (!$route) {
            return response()->json([
                'message' => 'No active route found for today.',
                'data' => null
            ]);
        }

        // Fetch stops sequentially, loading delivery and spatial coordinates
        $stops = $route->stops()->get()->map(function ($stop) {
            $delivery = $stop->delivery;
            
            // Extract geometry point coordinates securely
            $coords = DB::selectOne(
                "SELECT ST_X(dropoff_location::geometry) as lng, ST_Y(dropoff_location::geometry) as lat FROM deliveries WHERE id = ?",
                [$delivery->id]
            );

            // Fetch order items & customer details
            $order = $delivery->order;
            $customer = $order->customer;
            $items = $order->items;

            return [
                'id' => $stop->id,
                'sequence_number' => $stop->sequence_number,
                'eta' => $stop->eta ? $stop->eta->toIso8601String() : null,
                'status' => $stop->status, // pending, arrived, completed, skipped
                'delivery' => [
                    'id' => $delivery->id,
                    'tracking_number' => $delivery->tracking_number,
                    'weight_kg' => (float) $delivery->weight_kg,
                    'dropoff_address' => $delivery->dropoff_address,
                    'lng' => $coords ? (float) $coords->lng : null,
                    'lat' => $coords ? (float) $coords->lat : null,
                    'status' => $delivery->status,
                    'order' => [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'total_amount' => (float) $order->total_amount,
                        'amount_due_cod' => (float) $order->amount_due_cod,
                        'payment_method' => $order->payment_method,
                        'customer' => [
                            'id' => $customer->id,
                            'name' => $customer->name,
                            'phone' => $customer->phone,
                        ],
                        'items' => $items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'product_name' => $item->product_name,
                                'sku' => $item->sku,
                                'quantity' => $item->quantity,
                            ];
                        })
                    ]
                ]
            ];
        });

        return response()->json([
            'data' => [
                'id' => $route->id,
                'status' => $route->status,
                'cash_to_remit' => (float) $route->cash_to_remit,
                'date' => $route->date->toDateString(),
                'stops' => $stops
            ]
        ]);
    }

    /**
     * Mark a route stop as "arrived".
     */
    public function arrive(Request $request, $id)
    {
        $stop = RouteStop::findOrFail($id);
        $route = $stop->route;

        // Verify route driver matching
        if ($route->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        // Set route to in_progress if not already
        if ($route->status !== 'in_progress') {
            $route->status = 'in_progress';
            $route->save();
        }

        $stop->status = 'arrived';
        $stop->save();

        $delivery = $stop->delivery;
        $delivery->status = 'out_for_delivery';
        $delivery->save();

        return response()->json([
            'message' => 'Arrived at stop successfully.',
            'data' => ['stop_status' => $stop->status, 'delivery_status' => $delivery->status]
        ]);
    }

    /**
     * Mark a route stop as "completed" (delivered successfully).
     */
    public function complete(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
            'photo' => 'nullable|image|max:10240', // Max 10MB camera uploads
        ]);

        $stop = RouteStop::findOrFail($id);
        $route = $stop->route;

        if ($route->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        $delivery = $stop->delivery;
        $order = $delivery->order;

        DB::transaction(function () use ($request, $stop, $delivery, $order) {
            // Update statuses
            $stop->status = 'completed';
            $stop->save();

            $delivery->status = 'delivered';
            $delivery->save();

            $order->status = 'completed';
            $order->save();

            // Save cash collection snapshot if applicable
            if ($order->amount_due_cod > 0) {
                // Future payment integration trigger can be here
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

        // Auto-complete route if all stops are processed
        $remainingStops = RouteStop::where('route_id', $route->id)
            ->whereIn('status', ['pending', 'arrived'])
            ->count();

        if ($remainingStops === 0) {
            $route->status = 'completed';
            $route->save();
        }

        return response()->json([
            'message' => 'Stop resolved as delivered successfully.',
            'data' => ['stop_status' => $stop->status, 'delivery_status' => $delivery->status]
        ]);
    }

    /**
     * Mark a route stop as "failed" (skipped / delivery issue).
     */
    public function fail(Request $request, $id)
    {
        $request->validate([
            'reason_code' => 'required|string|in:customer_unreachable,address_not_found,refused_payment,refused_delivery,damaged_package,other',
            'notes' => 'nullable|string|max:1000',
        ]);

        $stop = RouteStop::findOrFail($id);
        $route = $stop->route;

        if ($route->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized stop access.'], 403);
        }

        $delivery = $stop->delivery;

        DB::transaction(function () use ($request, $stop, $delivery) {
            $stop->status = 'skipped';
            $stop->save();

            $delivery->status = 'failed';
            $delivery->save();

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

        // Auto-complete route if all stops are processed
        $remainingStops = RouteStop::where('route_id', $route->id)
            ->whereIn('status', ['pending', 'arrived'])
            ->count();

        if ($remainingStops === 0) {
            $route->status = 'completed';
            $route->save();
        }

        return response()->json([
            'message' => 'Stop exception logged successfully.',
            'data' => ['stop_status' => $stop->status, 'delivery_status' => $delivery->status]
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
