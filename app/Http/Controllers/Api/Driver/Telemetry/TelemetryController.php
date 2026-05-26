<?php

namespace App\Http\Controllers\Api\Driver\Telemetry;

use App\Http\Controllers\Controller;
use App\Models\Fleet\Vehicle;
use App\Events\VehicleLocationUpdated;
use App\Jobs\ProcessDriverTelemetry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TelemetryController extends Controller
{
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

        // 2. Dispatch database write operations to the background queue
        ProcessDriverTelemetry::dispatch($user->id, $telemetryData);

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
}
