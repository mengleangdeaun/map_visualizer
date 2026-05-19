<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Models\System\SystemSetting;
use App\Services\System\ExchangeRate\ExchangeRateService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SystemSettingController extends Controller
{
    protected $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * Get all system settings as a key-value object.
     */
    public function index(): JsonResponse
    {
        $settings = SystemSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exchange_rate_mode' => 'required|string|in:auto,manual',
            'exchange_rate_manual_value' => 'required|numeric|min:0',
            'exchange_rate_provider_url' => 'required|url',
            'exchange_rate_data_path' => 'required|string|in:average,bid,ask',
        ]);

        foreach ($data as $key => $value) {
            SystemSetting::setValue($key, $value, is_numeric($value) ? 'float' : 'string');
        }

        // If global mode was set to manual, immediately apply the manual value as current value
        if ($data['exchange_rate_mode'] === 'manual') {
            SystemSetting::setValue('exchange_rate_current_value', $data['exchange_rate_manual_value'], 'float');
            
            // Push the manual rate to all companies configured in 'global' mode
            $companies = \App\Models\System\Company::where('exchange_rate_mode', 'global')->get();
            foreach ($companies as $company) {
                \App\Models\System\ExchangeRate::updateOrCreate(
                    [
                        'company_id' => $company->id,
                        'from_currency' => 'USD',
                        'to_currency' => 'KHR',
                        'effective_date' => now()->startOfDay(),
                    ],
                    [
                        'rate' => (float)$data['exchange_rate_manual_value'],
                    ]
                );
            }
        } else {
            // Trigger sync immediately to populate auto value
            $this->exchangeRateService->syncExchangeRate();
        }

        $settings = SystemSetting::all()->pluck('value', 'key');
        return response()->json([
            'message' => 'System settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * Manually trigger exchange rate sync.
     */
    public function sync(): JsonResponse
    {
        $result = $this->exchangeRateService->syncExchangeRate();

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Exchange rate synchronized successfully!',
                'current_value' => $result['rate'],
                'last_sync' => $result['last_sync']
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Failed to synchronize exchange rate: ' . $result['error']
            ], 500);
        }
    }
}
