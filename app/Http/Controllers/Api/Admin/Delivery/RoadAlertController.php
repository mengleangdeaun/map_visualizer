<?php

namespace App\Http\Controllers\Api\Admin\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Delivery\RoadAlert;
use App\Events\Delivery\RoadAlertCreated;
use Illuminate\Http\Request;
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
}
