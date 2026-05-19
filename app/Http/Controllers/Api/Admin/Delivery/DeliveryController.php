<?php

namespace App\Http\Controllers\Api\Admin\Delivery;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Delivery\StoreDeliveryRequest;
use App\Http\Requests\Admin\Delivery\UpdateDeliveryRequest;
use App\Services\Delivery\DeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    protected $deliveryService;

    public function __construct(DeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Display a listing of deliveries belonging to the company.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['per_page', 'search', 'status']);
        $user = $request->user();

        // Enforce multi-tenant company scope
        if ($user->company_id) {
            $params['company_id'] = $user->company_id;
        } else {
            // Support platform-level staff filtering by param
            $params['company_id'] = $request->query('company_id');
        }

        $deliveries = $this->deliveryService->list($params);

        return response()->json($deliveries);
    }

    /**
     * Store a newly created delivery, order, and order items.
     */
    public function store(StoreDeliveryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Enforce company scope
        if ($user->company_id) {
            $validated['company_id'] = $user->company_id;
        }

        $delivery = $this->deliveryService->create($validated);

        return response()->json([
            'message' => 'Delivery and order created successfully',
            'data' => $delivery
        ], 201);
    }

    /**
     * Display the specified delivery.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $delivery = $this->deliveryService->findById($id, $companyId);

        return response()->json($delivery);
    }

    /**
     * Update the specified delivery.
     */
    public function update(UpdateDeliveryRequest $request, string $id): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Retrieve the delivery within scope to ensure unauthorized access is blocked
        $delivery = $this->deliveryService->findById($id, $companyId);
        $validated = $request->validated();

        $updatedDelivery = $this->deliveryService->update($delivery, $validated);

        return response()->json([
            'message' => 'Delivery updated successfully',
            'data' => $updatedDelivery
        ]);
    }

    /**
     * Remove the specified delivery, order, and order items.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $delivery = $this->deliveryService->findById($id, $companyId);
        $this->deliveryService->delete($delivery);

        return response()->json([
            'message' => 'Delivery and associated order deleted successfully'
        ]);
    }
}
