<?php

namespace App\Http\Requests\System\ExchangeRate;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => 'sometimes|required|exists:companies,id',
            'from_currency' => 'sometimes|required|string|size:3',
            'to_currency' => 'sometimes|required|string|size:3',
            'rate' => 'sometimes|required|numeric|min:0',
            'effective_date' => 'sometimes|required|date',
        ];
    }
}
