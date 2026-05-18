<?php

namespace App\Models\Fleet;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User\User;

class VehicleShift extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'started_at',
        'ended_at',
        'status', // active, completed
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Get the vehicle associated with this shift.
     */
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * Get the driver associated with this shift.
     */
    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
