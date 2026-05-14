<?php

namespace App\Models\Fleet;

use App\Models\System\Company;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory, HasUlids;
    
    protected $appends = ['latitude', 'longitude'];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'type',
        'location',
        'geofence',
    ];

    /**
     * Get the company that owns the location.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get latitude from location point.
     */
    public function getLatitudeAttribute()
    {
        return $this->attributes['latitude'] ?? null;
    }

    /**
     * Get longitude from location point.
     */
    public function getLongitudeAttribute()
    {
        return $this->attributes['longitude'] ?? null;
    }
}
