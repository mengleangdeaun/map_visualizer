<?php

namespace App\Http\Requests\Admin\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class AddRouteStopsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'delivery_ids'   => 'required|array|min:1',
            'delivery_ids.*' => 'exists:deliveries,id',
        ];
    }
}
