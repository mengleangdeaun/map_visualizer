<?php

namespace App\Http\Controllers\Api\Admin\Fleet;

use App\Http\Controllers\Controller;
use App\Models\Fleet\Vehicle;
use App\Services\Admin\Fleet\VehicleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VehicleController extends Controller
{
    protected $vehicleService;

    public function __construct(VehicleService $vehicleService)
    {
        $this->vehicleService = $vehicleService;
    }

    /**
     * Display a listing of vehicles.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['per_page', 'search', 'type', 'company_id']);
        $user = $request->user();
        
        // If it's a platform staff (no company_id), allow filtering by any company_id from params
        // Otherwise, force the user's own company_id
        if ($user->company_id) {
            $params['company_id'] = $user->company_id;
        }

        $vehicles = $this->vehicleService->list($params);

        return response()->json($vehicles);
    }

    /**
     * Store a newly created vehicle in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'driver_id' => 'nullable|ulid|exists:users,id',
            'type' => 'required|in:motorcycle,tuktuk,minivan,box_truck',
            'plate_number' => 'required|string|max:20',
            'max_weight_kg' => 'nullable|numeric',
            'max_volume_cbm' => 'nullable|numeric',
            'image_url' => 'nullable|string',
            'max_speed_kmh' => 'nullable|numeric|min:0',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        if ($request->user()->company_id) {
            $validated['company_id'] = $request->user()->company_id;
        }

        $vehicle = $this->vehicleService->create($validated);

        return response()->json([
            'message' => 'Vehicle created successfully',
            'data' => $vehicle
        ], 201);
    }

    /**
     * Display the specified vehicle.
     */
    public function show(string $id): JsonResponse
    {
        $vehicle = $this->vehicleService->findById($id);
        return response()->json($vehicle);
    }

    /**
     * Update the specified vehicle in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        
        $validated = $request->validate([
            'driver_id' => 'nullable|ulid|exists:users,id',
            'type' => 'required|in:motorcycle,tuktuk,minivan,box_truck',
            'plate_number' => 'required|string|max:20',
            'max_weight_kg' => 'nullable|numeric',
            'max_volume_cbm' => 'nullable|numeric',
            'image_url' => 'nullable|string',
            'is_active' => 'boolean',
            'max_speed_kmh' => 'nullable|numeric|min:0',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $vehicle = $this->vehicleService->update($vehicle, $validated);

        return response()->json([
            'message' => 'Vehicle updated successfully',
            'data' => $vehicle
        ]);
    }

    /**
     * Remove the specified vehicle from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        $this->vehicleService->delete($vehicle);

        return response()->json([
            'message' => 'Vehicle deleted successfully'
        ]);
    }

    /**
     * Update vehicle live location.
     */
    public function updateLocation(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        return $this->processLocationUpdate($request, $vehicle);
    }

    /**
     * Update active vehicle live location for the authenticated driver.
     */
    public function updateActiveLocation(Request $request): JsonResponse
    {
        $user = $request->user();
        $vehicle = Vehicle::where('driver_id', $user->id)->first();

        if (!$vehicle) {
            return response()->json(['message' => 'No active vehicle assigned to you'], 404);
        }

        return $this->processLocationUpdate($request, $vehicle);
    }

    /**
     * Shared logic for processing location updates.
     */
    protected function processLocationUpdate(Request $request, Vehicle $vehicle): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'heading' => 'nullable|numeric',
            'speed' => 'nullable|numeric',
        ]);

        $vehicle = $this->vehicleService->update($vehicle, [
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        // Broadcast the update to the fleet channel
        event(new \App\Events\VehicleLocationUpdated(
            $validated['latitude'],
            $validated['longitude'],
            $validated['heading'] ?? 0,
            $validated['speed'] ?? 0,
            $vehicle->id,
            $vehicle->company_id,
            $vehicle->max_speed_kmh
        ));

        return response()->json([
            'message' => 'Vehicle location updated',
            'data' => $vehicle
        ]);
    }
}
