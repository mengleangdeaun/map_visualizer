<?php

namespace App\Models\Delivery;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteStop extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'route_id',
        'delivery_id',
        'sequence_number',
        'eta',
        'arrived_at',
        'completed_at',
        'status',
        'notes',
        'leg_distance_km',
        'leg_duration_min',
        'leg_geometry',
    ];

    protected $casts = [
        'eta'              => 'datetime',
        'arrived_at'       => 'datetime',
        'completed_at'     => 'datetime',
        'sequence_number'  => 'integer',
        'leg_distance_km'  => 'decimal:2',
        'leg_duration_min' => 'integer',
        'leg_geometry'     => 'array',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }
}
