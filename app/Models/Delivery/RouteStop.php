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
        'status', // pending, arrived, completed, skipped
    ];

    protected $casts = [
        'eta' => 'datetime',
        'sequence_number' => 'integer',
    ];

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }
}
