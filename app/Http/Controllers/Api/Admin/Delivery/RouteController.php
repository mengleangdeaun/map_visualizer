<?php

namespace App\Http\Controllers\Api\Admin\Delivery;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Delivery\AddRouteStopsRequest;
use App\Http\Requests\Admin\Delivery\StoreRouteRequest;
use App\Http\Requests\Admin\Delivery\UpdateRouteRequest;
use App\Models\Delivery\RouteStop;
use App\Services\Delivery\RouteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function __construct(protected RouteService $routeService) {}

    /**
     * List routes, filterable by driver, date, status.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['per_page', 'driver_id', 'date', 'status']);
        $user   = $request->user();

        $params['company_id'] = $user->company_id ?: $request->query('company_id');

        $routes = $this->routeService->list($params);

        return response()->json($routes);
    }

    /**
     * Create a new route, optionally with an initial set of deliveries.
     */
    public function store(StoreRouteRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user      = $request->user();

        $validated['company_id'] = $user->company_id;

        $deliveryIds = $validated['delivery_ids'] ?? [];
        unset($validated['delivery_ids']);

        $route = $this->routeService->create($validated);

        if (!empty($deliveryIds)) {
            $route = $this->routeService->addDeliveries($route, $deliveryIds);
        }

        return response()->json([
            'message' => 'Route created successfully.',
            'data'    => $route,
        ], 201);
    }

    /**
     * Show a single route with all stops and delivery details.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $route = $this->routeService->findById($id, $request->user()->company_id);

        return response()->json(['data' => $route]);
    }

    /**
     * Update route metadata (driver, hub, date, status, notes).
     * Setting status to 'in_progress' broadcasts to the driver via Reverb.
     */
    public function update(UpdateRouteRequest $request, string $id): JsonResponse
    {
        $route = $this->routeService->findById($id, $request->user()->company_id);
        $updated = $this->routeService->update($route, $request->validated());

        return response()->json([
            'message' => 'Route updated successfully.',
            'data'    => $updated,
        ]);
    }

    /**
     * Delete a route (detaches stops; does NOT delete deliveries).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $route = $this->routeService->findById($id, $request->user()->company_id);
        $this->routeService->delete($route);

        return response()->json(['message' => 'Route deleted successfully.']);
    }

    /**
     * Add deliveries to a route.
     */
    public function addStops(AddRouteStopsRequest $request, string $id): JsonResponse
    {
        $route   = $this->routeService->findById($id, $request->user()->company_id);
        $updated = $this->routeService->addDeliveries($route, $request->validated()['delivery_ids']);

        return response()->json([
            'message' => 'Stops added to route.',
            'data'    => $updated,
        ]);
    }

    /**
     * Remove a single stop from a route.
     */
    public function removeStop(Request $request, string $routeId, string $stopId): JsonResponse
    {
        $route = $this->routeService->findById($routeId, $request->user()->company_id);
        $stop  = RouteStop::where('route_id', $route->id)->findOrFail($stopId);
        $updated = $this->routeService->removeStop($stop);

        return response()->json([
            'message' => 'Stop removed from route.',
            'data'    => $updated,
        ]);
    }

    /**
     * Manually reorder stops by providing ordered delivery IDs.
     */
    public function reorder(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'ordered_delivery_ids'   => 'required|array|min:1',
            'ordered_delivery_ids.*' => 'exists:deliveries,id',
        ]);

        $route   = $this->routeService->findById($id, $request->user()->company_id);
        $updated = $this->routeService->reorder($route, $request->input('ordered_delivery_ids'));

        return response()->json([
            'message' => 'Route stops reordered.',
            'data'    => $updated,
        ]);
    }

    /**
     * Run nearest-neighbor + OSRM optimization on the route.
     */
    public function optimize(Request $request, string $id): JsonResponse
    {
        $route   = $this->routeService->findById($id, $request->user()->company_id);
        $updated = $this->routeService->optimize($route);

        return response()->json([
            'message' => 'Route optimized successfully.',
            'data'    => $updated,
        ]);
    }
}
