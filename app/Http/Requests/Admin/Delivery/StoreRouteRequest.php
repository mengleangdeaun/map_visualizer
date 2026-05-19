<?php

namespace App\Http\Requests\Admin\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class StoreRouteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'driver_id'    => 'nullable|exists:users,id',
            'hub_id'       => 'nullable|exists:locations,id',
            'date'         => 'required|date',
            'notes'        => 'nullable|string|max:1000',
            'delivery_ids' => 'nullable|array',
            'delivery_ids.*' => 'exists:deliveries,id',
        ];
    }
}
