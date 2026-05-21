<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemCompanyResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'tax_id' => $this->tax_id,
            'base_currency' => $this->base_currency,
            'logo_url' => $this->logo_url,
            'logo_full_url' => $this->logo_full_url,
            'status' => $this->status,
            'telegram_user_id' => $this->telegram_user_id,
            'exchange_rate_mode' => $this->exchange_rate_mode,
            'exchange_rate_override_value' => $this->exchange_rate_override_value !== null ? (float) $this->exchange_rate_override_value : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'telegram_settings' => $this->relationLoaded('telegramSettings') ? $this->telegramSettings : null,
        ];
    }
}
