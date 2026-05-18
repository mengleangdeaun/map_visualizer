<?php
 
namespace App\Models\Fleet;
 
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
 
class Vehicle extends Model
{
    use HasFactory, HasUlids, HasAuditFields;
 
    protected $fillable = [
        'company_id',
        'driver_id',
        'type',
        'plate_number',
        'max_weight_kg',
        'max_volume_cbm',
        'image_url',
        'is_active',
        'max_speed_kmh',
        'last_location',
        'last_telemetry_at',
        'created_by',
        'updated_by',
    ];

    protected $appends = ['latitude', 'longitude'];

    /**
     * Get the latitude from the geometry point.
     */
    protected function latitude(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function () {
                if (!$this->last_location) return null;
                // PostgreSQL returns binary/wkb. For simplicity in this demo, 
                // we'll assume it's fetched via a select raw if needed, 
                // or we use a more robust way to parse it.
                return $this->attributes['latitude'] ?? null;
            }
        );
    }

    /**
     * Get the longitude from the geometry point.
     */
    protected function longitude(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function () {
                if (!$this->last_location) return null;
                return $this->attributes['longitude'] ?? null;
            }
        );
    }

    /**
     * Get the company that owns the vehicle.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\System\Company::class);
    }

    /**
     * Get the driver assigned to the vehicle.
     */
    public function driver()
    {
        return $this->belongsTo(\App\Models\User\User::class, 'driver_id');
    }

    /**
     * Get the shifts for this vehicle.
     */
    public function shifts()
    {
        return $this->hasMany(VehicleShift::class);
    }

    /**
     * Get the active shift for this vehicle.
     */
    public function activeShift()
    {
        return $this->hasOne(VehicleShift::class)->whereNull('ended_at');
    }
}
