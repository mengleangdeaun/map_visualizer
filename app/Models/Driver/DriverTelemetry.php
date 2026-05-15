<?php

namespace App\Models\Driver;

use App\Models\Fleet\Vehicle;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverTelemetry extends Model
{
    use HasUlids;

    protected $table = 'driver_telemetry';

    protected $fillable = [
        'driver_id',
        'vehicle_id',
        'speed_kmh',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }
}
