<?php

namespace App\Models\System;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Company extends Model
{
    use HasFactory, HasUlids, HasAuditFields;
    
    protected $appends = ['logo_full_url'];

    protected $fillable = [
        'name',
        'slug',
        'tax_id',
        'base_currency',
        'logo_url',
        'status',
        'telegram_user_id',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the full URL for the logo.
     * Supports local and cloud storage automatically.
     */
    protected function logoFullUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->logo_url ? (filter_var($this->logo_url, FILTER_VALIDATE_URL) ? $this->logo_url : Storage::disk('public')->url($this->logo_url)) : null,
        );
    }

    /**
     * Get the users for the company.
     */
    public function users()
    {
        return $this->hasMany(\App\Models\User\User::class);
    }

    /**
     * Get the telegram settings for the company.
     */
    public function telegramSettings()
    {
        return $this->hasOne(CompanyTelegramSettings::class);
    }
}
