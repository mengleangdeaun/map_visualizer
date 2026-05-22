<?php

namespace App\Http\Controllers\Api\Admin\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Delivery\RoadAlert;
use App\Events\Delivery\RoadAlertCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RoadAlertController extends Controller
{
    /**
     * Store a newly created road alert and broadcast it in real time.
     */
    public function store(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:1000',
            'type' => 'nullable|string|in:blockage,accident,flood,traffic',
            'lng' => 'required|numeric|between:-180,180',
            'lat' => 'required|numeric|between:-90,90',
        ]);

        $user = $request->user();
        
        // Use company from active user
        $companyId = $user->company_id;
        if (!$companyId) {
            return response()->json(['message' => 'User does not belong to any company.'], 403);
        }

        // Store using transactional PostGIS POINT insert
        $alert = DB::transaction(function () use ($request, $companyId) {
            $lng = $request->input('lng');
            $lat = $request->input('lat');
            
            $newAlert = new RoadAlert();
            $newAlert->company_id = $companyId;
            $newAlert->description = $request->input('description');
            $newAlert->type = $request->input('type', 'blockage');
            $newAlert->location = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            $newAlert->save();
            
            return $newAlert;
        });

        // Trigger real-time broadcast via Reverb
        broadcast(new RoadAlertCreated($alert))->toOthers();

        // Dispatch Dynamic Action Notification
        $actionKey = $user->role === 'driver' ? 'driver_create_roadblock' : 'admin_create_roadblock';
        $targetUsers = $user->role === 'driver' 
            ? \App\Models\User\User::where('company_id', $companyId)->whereIn('role', ['admin', 'dispatcher'])->get()
            : \App\Models\User\User::where('company_id', $companyId)->where('role', 'driver')->get();

        foreach ($targetUsers as $targetUser) {
            $targetUser->notify(new \App\Notifications\DynamicActionNotification(
                $actionKey,
                $companyId,
                [
                    'title' => 'Roadblock Warn Alert',
                    'hazard_type' => $alert->type,
                    'description' => $alert->description,
                    'lng' => $request->input('lng'),
                    'lat' => $request->input('lat'),
                ]
            ));
        }

        // Parse coordinate fields to return clean representation
        $responseAlert = [
            'id' => $alert->id,
            'description' => $alert->description,
            'type' => $alert->type,
            'lng' => (float) $request->input('lng'),
            'lat' => (float) $request->input('lat'),
            'created_at' => $alert->created_at->toIso8601String(),
        ];

        return response()->json([
            'message' => 'Road alert published and broadcasted successfully.',
            'data' => $responseAlert
        ], 201);
    }

    /**
     * Fetch active road alerts for the admin's company.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;
        
        if (!$companyId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $alerts = DB::select(
            "SELECT id, description, type, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat, created_at 
             FROM road_alerts 
             WHERE company_id = ? 
             ORDER BY created_at DESC",
             [$companyId]
        );

        return response()->json(['data' => $alerts]);
    }

    /**
     * Resolve and delete a road alert, broadcasting the removal in real time.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        if (!$companyId) {
            return response()->json(['message' => 'Unauthorized scope.'], 403);
        }

        $alert = RoadAlert::where('company_id', $companyId)->findOrFail($id);
        $alert->delete();

        // Broadcast deletion event via Reverb
        broadcast(new \App\Events\Delivery\RoadAlertDeleted($id, $companyId))->toOthers();

        return response()->json([
            'message' => 'Road alert resolved and cleared successfully.'
        ]);
    }
}
