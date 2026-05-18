<?php

namespace App\Models\Delivery;

use App\Models\User\User;
use App\Models\Fleet\Location;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    protected $fillable = [
        'company_id',
        'order_id',
        'tracking_number',
        'weight_kg',
        'dropoff_address',
        'dropoff_location',
        'status', // pending, at_hub, linehaul, out_for_delivery, delivered, failed
        'origin_hub_id',
        'current_hub_id',
        'route_id',
        'driver_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function originHub()
    {
        return $this->belongsTo(Location::class, 'origin_hub_id');
    }

    public function currentHub()
    {
        return $this->belongsTo(Location::class, 'current_hub_id');
    }

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }

    public function stop()
    {
        return $this->hasOne(RouteStop::class, 'delivery_id');
    }
}
