<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyTelegramSettings extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'company_telegram_settings';

    protected $fillable = [
        'company_id',
        'bot_token',
        'company_chat_id',
        'notify_pwa',
        'notify_driver_telegram',
        'notify_company_telegram',
        'bot_username',
        'bot_name',
    ];

    protected $casts = [
        'notify_pwa' => 'boolean',
        'notify_driver_telegram' => 'boolean',
        'notify_company_telegram' => 'boolean',
    ];

    /**
     * Get the company associated with the settings.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
