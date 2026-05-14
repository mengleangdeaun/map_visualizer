<?php

namespace App\Http\Requests\Fleet\Location;

use Illuminate\Foundation\Http\FormRequest;

class StoreLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => 'required|exists:companies,id',
            'code' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:main_sort,regional_hub,local_node',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'geofence' => 'nullable|string', // GeoJSON or WKT string
        ];
    }
}
