<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminVehicleResource extends JsonResource
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
            'company_id' => $this->company_id,
            'driver_id' => $this->driver_id,
            'type' => $this->type,
            'plate_number' => $this->plate_number,
            'max_weight_kg' => $this->max_weight_kg !== null ? (float) $this->max_weight_kg : null,
            'max_volume_cbm' => $this->max_volume_cbm !== null ? (float) $this->max_volume_cbm : null,
            'image_url' => $this->image_url,
            'is_active' => (bool) $this->is_active,
            'max_speed_kmh' => $this->max_speed_kmh !== null ? (float) $this->max_speed_kmh : null,
            'latitude' => $this->latitude ?? (isset($this->attributes['latitude']) ? (float) $this->attributes['latitude'] : null),
            'longitude' => $this->longitude ?? (isset($this->attributes['longitude']) ? (float) $this->attributes['longitude'] : null),
            'last_telemetry_at' => $this->last_telemetry_at,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'driver' => $this->relationLoaded('driver') && $this->driver ? [
                'id' => $this->driver->id,
                'name' => $this->driver->name,
                'phone' => $this->driver->phone,
                'email' => $this->driver->email,
            ] : null,
        ];
    }
}
