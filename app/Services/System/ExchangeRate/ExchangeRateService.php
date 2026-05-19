<?php

namespace App\Services\System\ExchangeRate;

use App\Models\System\ExchangeRate;
use App\Models\System\SystemSetting;
use App\Models\System\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;

class ExchangeRateService
{
    /**
     * List exchange rates with pagination and filtering.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $companyId = $params['company_id'] ?? null;
        $search = $params['search'] ?? null;

        $query = ExchangeRate::query()->with('company');

        if ($companyId) {
            $query->forCompany($companyId);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('from_currency', 'LIKE', "%{$search}%")
                  ->orWhere('to_currency', 'LIKE', "%{$search}%");
            });
        }

        return $query->latest('effective_date')->paginate($perPage);
    }

    /**
     * Create a new exchange rate.
     */
    public function create(array $data): ExchangeRate
    {
        return ExchangeRate::create($data);
    }

    /**
     * Update an existing exchange rate.
     */
    public function update(ExchangeRate $exchangeRate, array $data): ExchangeRate
    {
        $exchangeRate->update($data);
        return $exchangeRate;
    }

    /**
     * Delete an exchange rate.
     */
    public function delete(ExchangeRate $exchangeRate): bool
    {
        return $exchangeRate->delete();
    }

    /**
     * Synchronize exchange rate from National Bank of Cambodia (NBC).
     */
    public function syncExchangeRate(): array
    {
        try {
            $providerUrl = SystemSetting::getValue('exchange_rate_provider_url', 'https://www.nbc.gov.kh/api/exRate.php');
            $dataPath = SystemSetting::getValue('exchange_rate_data_path', 'average');

            $xmlString = null;

            // Try to request NBC API
            try {
                $response = Http::timeout(10)->get($providerUrl);
                if ($response->successful()) {
                    $xmlString = $response->body();
                }
            } catch (\Exception $e) {
                Log::warning("NBC Exchange Rate API connection failed: " . $e->getMessage() . ". Using local fallback.");
            }

            // Fallback to local XML file in apiResponse/exchangRate.xml
            if (!$xmlString) {
                $localPath = base_path('apiResponse/exchangRate.xml');
                if (file_exists($localPath)) {
                    $xmlString = file_get_contents($localPath);
                } else {
                    return [
                        'success' => false,
                        'error' => 'API offline and local fallback file exchangRate.xml not found.'
                    ];
                }
            }

            // Parse XML safely
            $xml = @simplexml_load_string($xmlString);
            if ($xml === false) {
                return [
                    'success' => false,
                    'error' => 'Invalid XML response structure received.'
                ];
            }

            $rate = null;
            foreach ($xml->ex as $ex) {
                if ((string)$ex->key === 'USD/KHR') {
                    $rate = (float)$ex->{$dataPath};
                    break;
                }
            }

            if ($rate === null) {
                return [
                    'success' => false,
                    'error' => 'USD/KHR currency key not found in the XML response.'
                ];
            }

            // Save synced values globally
            $now = now()->toIso8601String();
            SystemSetting::setValue('exchange_rate_current_value', $rate, 'float');
            SystemSetting::setValue('exchange_rate_last_sync', $now, 'string');

            // If global mode is auto, push to companies using 'global' mode
            $globalMode = SystemSetting::getValue('exchange_rate_mode', 'auto');
            if ($globalMode === 'auto') {
                $companies = Company::where('exchange_rate_mode', 'global')->get();
                foreach ($companies as $company) {
                    ExchangeRate::updateOrCreate(
                        [
                            'company_id' => $company->id,
                            'from_currency' => 'USD',
                            'to_currency' => 'KHR',
                            'effective_date' => now()->startOfDay(),
                        ],
                        [
                            'rate' => $rate,
                        ]
                    );
                }
            }

            return [
                'success' => true,
                'rate' => $rate,
                'last_sync' => $now
            ];

        } catch (\Exception $e) {
            Log::error("Exchange rate sync error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
