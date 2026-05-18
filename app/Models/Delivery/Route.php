<?php

namespace App\Models\Delivery;

use App\Models\User\User;
use App\Models\Fleet\Location;
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
        'status', // draft, optimized, in_progress, completed
        'cash_to_remit',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'cash_to_remit' => 'decimal:2',
    ];

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
            'route_id',      // Foreign key on RouteStop table
            'id',            // Foreign key on Delivery table
            'id',            // Local key on Route table
            'delivery_id'    // Local key on RouteStop table
        );
    }
}
