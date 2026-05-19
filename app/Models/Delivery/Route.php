<?php

namespace App\Models\Delivery;

use App\Models\Fleet\Location;
use App\Models\User\User;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    protected $fillable = [
        'company_id',
        'driver_id',
        'hub_id',
        'date',
        'status',
        'notes',
        'total_weight_kg',
        'stop_count',
        'estimated_distance_km',
        'estimated_duration_min',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date'                   => 'date',
        'total_weight_kg'        => 'decimal:2',
        'estimated_distance_km'  => 'decimal:2',
        'estimated_duration_min' => 'integer',
        'stop_count'             => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function hub()
    {
        return $this->belongsTo(Location::class, 'hub_id');
    }

    public function stops()
    {
        return $this->hasMany(RouteStop::class, 'route_id')->orderBy('sequence_number');
    }

    public function deliveries()
    {
        return $this->hasManyThrough(
            Delivery::class,
            RouteStop::class,
            'route_id',
            'id',
            'id',
            'delivery_id'
        );
    }
}
