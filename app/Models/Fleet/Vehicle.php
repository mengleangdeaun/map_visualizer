<?php
 
namespace App\Models\Fleet;
 
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
 
class Vehicle extends Model
{
    use HasFactory, HasUlids;
 
    protected $fillable = [
        'company_id',
        'driver_id',
        'type',
        'plate_number',
        'max_weight_kg',
        'max_volume_cbm',
        'image_url',
    ];
 
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
}
