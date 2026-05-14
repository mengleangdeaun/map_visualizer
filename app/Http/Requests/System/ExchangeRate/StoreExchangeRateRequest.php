<?php

namespace App\Http\Requests\System\ExchangeRate;

use Illuminate\Foundation\Http\FormRequest;

class StoreExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => 'required|exists:companies,id',
            'from_currency' => 'required|string|size:3',
            'to_currency' => 'required|string|size:3',
            'rate' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ];
    }
}
