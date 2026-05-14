<?php

namespace App\Services\System\ExchangeRate;

use App\Models\System\ExchangeRate;
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
}
