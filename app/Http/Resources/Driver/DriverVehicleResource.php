<?php

namespace App\Http\Resources\Driver;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverVehicleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        if (is_null($this->resource)) {
            return [];
        }

        return [
            'id' => $this->id,
            'plate_number' => $this->plate_number,
            'model' => $this->type,
            'type' => $this->type,
            'status' => $this->is_active ? 'active' : 'inactive',
            'is_active' => (bool) $this->is_active,
        ];
    }
}
