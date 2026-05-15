<?php

namespace App\Http\Controllers\Api\Driver\Telemetry;

use App\Http\Controllers\Controller;
use App\Models\Driver\DriverTelemetry;
use App\Models\Fleet\Vehicle;
use App\Events\VehicleLocationUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        // Create telemetry record
        $telemetry = new DriverTelemetry();
        $telemetry->driver_id = $user->id;
        $telemetry->vehicle_id = $vehicle?->id;
        $telemetry->speed_kmh = $validated['speed'] ? round($validated['speed'] * 3.6) : 0;
        $telemetry->recorded_at = now();
        $telemetry->save();

        // Update spatial location using raw SQL for SRID 4326
        DB::statement("UPDATE driver_telemetry SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?", [
            $validated['longitude'],
            $validated['latitude'],
            $telemetry->id
        ]);

        // Update the vehicle's current position if assigned
        if ($vehicle) {
            $vehicle->update([
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'is_active' => true,
                'last_telemetry_at' => now(),
            ]);

            // Broadcast real-time update for dispatchers
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
