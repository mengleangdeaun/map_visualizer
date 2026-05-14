<?php

namespace App\Http\Controllers\Api\System\ExchangeRate;

use App\Http\Controllers\Controller;
use App\Models\System\ExchangeRate;
use App\Services\System\ExchangeRate\ExchangeRateService;
use App\Http\Requests\System\ExchangeRate\StoreExchangeRateRequest;
use App\Http\Requests\System\ExchangeRate\UpdateExchangeRateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExchangeRateController extends Controller
{
    protected $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $rates = $this->exchangeRateService->list($request->all());
        return response()->json($rates);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreExchangeRateRequest $request): JsonResponse
    {
        $rate = $this->exchangeRateService->create($request->validated());
        return response()->json([
            'message' => 'Exchange rate created successfully',
            'data' => $rate->load('company')
        ], 210);
    }

    /**
     * Display the specified resource.
     */
    public function show(ExchangeRate $exchangeRate): JsonResponse
    {
        return response()->json($exchangeRate->load('company'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateExchangeRateRequest $request, ExchangeRate $exchangeRate): JsonResponse
    {
        $rate = $this->exchangeRateService->update($exchangeRate, $request->validated());
        return response()->json([
            'message' => 'Exchange rate updated successfully',
            'data' => $rate->load('company')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ExchangeRate $exchangeRate): JsonResponse
    {
        $this->exchangeRateService->delete($exchangeRate);
        return response()->json(['message' => 'Exchange rate deleted successfully']);
    }
}
