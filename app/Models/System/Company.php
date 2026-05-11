<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'name',
        'tax_id',
        'base_currency',
        'telegram_user_id',
    ];

    /**
     * Get the users for the company.
     */
    public function users()
    {
        return $this->hasMany(\App\Models\User\User::class);
    }
}
