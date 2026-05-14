<?php

namespace App\Models\Customer;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'company_id',
        'name',
        'phone',
        'telegram_user_id',
        'default_address',
        'default_location',
        'total_orders',
        'profile_url',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'default_location' => 'string', // Will be handled by PostGIS eventually
        'total_orders' => 'integer',
    ];

    /**
     * Get the company that owns the customer.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\System\Company::class);
    }
}
