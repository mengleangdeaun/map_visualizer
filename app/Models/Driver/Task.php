<?php

namespace App\Models\Driver;

use App\Models\Fleet\Vehicle;
use App\Models\System\Company;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'driver_id',
        'title',
        'description',
        'status',
        'contact_name',
        'contact_phone',
        'pickup_location',
        'dropoff_location',
        'pickup_address',
        'dropoff_address',
        'scheduled_at',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = [
        'pickup_lat', 'pickup_lng', 
        'dropoff_lat', 'dropoff_lng'
    ];

    /**
     * Get pickup latitude.
     */
    protected function pickupLat(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->attributes['pickup_lat'] ?? null
        );
    }

    /**
     * Get pickup longitude.
     */
    protected function pickupLng(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->attributes['pickup_lng'] ?? null
        );
    }

    /**
     * Get dropoff latitude.
     */
    protected function dropoffLat(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->attributes['dropoff_lat'] ?? null
        );
    }

    /**
     * Get dropoff longitude.
     */
    protected function dropoffLng(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->attributes['dropoff_lng'] ?? null
        );
    }

    /**
     * Get the company that owns the task.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the vehicle assigned to the task.
     */
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * Get the driver assigned to the task.
     */
    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
