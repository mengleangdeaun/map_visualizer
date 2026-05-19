<?php

namespace App\Http\Requests\Admin\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRouteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'driver_id' => 'nullable|exists:users,id',
            'hub_id'    => 'nullable|exists:locations,id',
            'date'      => 'nullable|date',
            'status'    => 'nullable|string|in:draft,optimized,in_progress,completed,cancelled',
            'notes'     => 'nullable|string|max:1000',
        ];
    }
}
