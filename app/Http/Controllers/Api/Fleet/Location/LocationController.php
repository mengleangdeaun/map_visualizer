<?php

namespace App\Http\Controllers\Api\Fleet\Location;

use App\Http\Controllers\Controller;
use App\Models\Fleet\Location;
use App\Services\Fleet\Location\LocationService;
use App\Http\Requests\Fleet\Location\StoreLocationRequest;
use App\Http\Requests\Fleet\Location\UpdateLocationRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    protected $locationService;

    public function __construct(LocationService $locationService)
    {
        $this->locationService = $locationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $locations = $this->locationService->list($request->all());
        return response()->json($locations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLocationRequest $request): JsonResponse
    {
        $location = $this->locationService->create($request->validated());
        return response()->json([
            'message' => 'Location created successfully',
            'data' => $location->load('company')
        ], 210);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $location = $this->locationService->findById($id);
        return response()->json($location->load('company'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLocationRequest $request, Location $location): JsonResponse
    {
        $location = $this->locationService->update($location, $request->validated());
        return response()->json([
            'message' => 'Location updated successfully',
            'data' => $location->load('company')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Location $location): JsonResponse
    {
        $this->locationService->delete($location);
        return response()->json(['message' => 'Location deleted successfully']);
    }
}
