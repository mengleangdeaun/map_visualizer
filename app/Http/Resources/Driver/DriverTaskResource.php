<?php

namespace App\Http\Resources\Driver;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverTaskResource extends JsonResource
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
            'tracking_number' => $this->tracking_number,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'contact_name' => $this->contact_name,
            'contact_phone' => $this->contact_phone,
            'pickup_address' => $this->pickup_address,
            'dropoff_address' => $this->dropoff_address,
            'pickup_lat' => $this->pickup_lat ?? (isset($this->attributes['pickup_lat']) ? (float) $this->attributes['pickup_lat'] : null),
            'pickup_lng' => $this->pickup_lng ?? (isset($this->attributes['pickup_lng']) ? (float) $this->attributes['pickup_lng'] : null),
            'dropoff_lat' => $this->dropoff_lat ?? (isset($this->attributes['dropoff_lat']) ? (float) $this->attributes['dropoff_lat'] : null),
            'dropoff_lng' => $this->dropoff_lng ?? (isset($this->attributes['dropoff_lng']) ? (float) $this->attributes['dropoff_lng'] : null),
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'priority' => $this->priority,
            'vehicle' => new DriverVehicleResource($this->whenLoaded('vehicle')),
        ];
    }
}
