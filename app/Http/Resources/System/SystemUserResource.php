<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemUserResource extends JsonResource
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
            'role' => $this->role,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'telegram_user_id' => $this->telegram_user_id,
            'base_hub_id' => $this->base_hub_id,
            'status' => $this->status,
            'operational_status' => $this->operational_status,
            'profile_url' => $this->profile_url,
            'profile_full_url' => $this->profile_full_url,
            'permissions' => $this->permissions,
            'telegram_chat_id' => $this->telegram_chat_id,
            'telegram_topic_id' => $this->telegram_topic_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'company' => new SystemCompanyResource($this->whenLoaded('company')),
            'hub' => $this->relationLoaded('hub') && $this->hub ? [
                'id' => $this->hub->id,
                'name' => $this->hub->name,
                'type' => $this->hub->type,
                'code' => $this->hub->code,
                'latitude' => $this->hub->latitude,
                'longitude' => $this->hub->longitude,
            ] : null,
        ];
    }
}
