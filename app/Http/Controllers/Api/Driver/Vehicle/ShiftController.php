<?php

namespace App\Http\Controllers\Api\Driver\Vehicle;

use App\Http\Controllers\Controller;
use App\Models\Fleet\Vehicle;
use App\Models\Fleet\VehicleShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    /**
     * Get the driver's active vehicle and shift details.
     */
    public function activeVehicle(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeShift = VehicleShift::with(['vehicle'])
            ->where('driver_id', $user->id)
            ->whereNull('ended_at')
            ->first();

        return response()->json([
            'shift' => $activeShift,
            'vehicle' => $activeShift?->vehicle,
        ]);
    }

    /**
     * Check in to a vehicle for the shift.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_id' => 'required|ulid|exists:vehicles,id',
        ]);

        $user = $request->user();
        $vehicle = Vehicle::findOrFail($request->vehicle_id);

        // Check if already checked in to this exact vehicle
        $existingShift = VehicleShift::where('driver_id', $user->id)
            ->where('vehicle_id', $vehicle->id)
            ->whereNull('ended_at')
            ->first();

        if ($existingShift) {
            return response()->json([
                'message' => 'Already checked in to this vehicle',
                'shift' => $existingShift,
                'vehicle' => $vehicle,
            ]);
        }

        // 1. Check out the current driver from any active shifts they are currently in
        $driverActiveShifts = VehicleShift::where('driver_id', $user->id)
            ->whereNull('ended_at')
            ->get();

        foreach ($driverActiveShifts as $shift) {
            $shift->update([
                'ended_at' => now(),
                'status' => 'completed',
            ]);
            
            // Set the old vehicle's driver_id to null
            Vehicle::where('id', $shift->vehicle_id)
                ->where('driver_id', $user->id)
                ->update(['driver_id' => null]);
        }

        // 2. Check out any other driver currently active in the selected vehicle
        $vehicleActiveShifts = VehicleShift::where('vehicle_id', $vehicle->id)
            ->whereNull('ended_at')
            ->get();

        foreach ($vehicleActiveShifts as $shift) {
            $shift->update([
                'ended_at' => now(),
                'status' => 'completed',
            ]);
        }

        // 3. Assign this driver as the vehicle's active operator
        $vehicle->update([
            'driver_id' => $user->id,
            'is_active' => true,
        ]);

        // 4. Create the new vehicle shift record
        $newShift = VehicleShift::create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $user->id,
            'started_at' => now(),
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Successfully checked in to vehicle',
            'shift' => $newShift,
            'vehicle' => $vehicle,
        ]);
    }

    /**
     * Check out of the current vehicle.
     */
    public function checkOut(Request $request): JsonResponse
    {
        $user = $request->user();

        // Find the active shift for this driver
        $activeShift = VehicleShift::where('driver_id', $user->id)
            ->whereNull('ended_at')
            ->first();

        if (!$activeShift) {
            return response()->json([
                'message' => 'No active shift found to check out from',
            ], 400);
        }

        // 1. Complete the shift record
        $activeShift->update([
            'ended_at' => now(),
            'status' => 'completed',
        ]);

        // 2. Remove the driver assignment from the vehicle
        $vehicle = Vehicle::find($activeShift->vehicle_id);
        if ($vehicle && $vehicle->driver_id === $user->id) {
            $vehicle->update(['driver_id' => null]);
        }

        return response()->json([
            'message' => 'Successfully checked out of vehicle',
        ]);
    }
}
