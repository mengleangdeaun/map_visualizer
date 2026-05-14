<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ExchangeRate extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'company_id',
        'from_currency',
        'to_currency',
        'rate',
        'effective_date',
    ];

    protected $casts = [
        'rate' => 'decimal:6',
        'effective_date' => 'datetime',
    ];

    /**
     * Scope to filter by company.
     */
    public function scopeForCompany(Builder $query, string $companyId): Builder
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope to get the latest rate for a currency pair.
     */
    public function scopeLatestRate(Builder $query, string $from, string $to): Builder
    {
        return $query->where('from_currency', $from)
                     ->where('to_currency', $to)
                     ->where('effective_date', '<=', now())
                     ->latest('effective_date');
    }

    /**
     * Get the company that owns the exchange rate.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
