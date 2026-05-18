<?php

namespace App\Models\Delivery;

use App\Models\System\Company;
use App\Models\User\User;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoadAlert extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    protected $fillable = [
        'company_id',
        'description',
        'type', // blockage, accident, flood, traffic etc.
        'location', // PostGIS point
        'created_by',
        'updated_by',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
