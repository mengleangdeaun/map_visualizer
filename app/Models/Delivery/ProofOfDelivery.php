<?php

namespace App\Models\Delivery;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProofOfDelivery extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    // Explicitly set table since database has it as plural
    protected $table = 'proof_of_deliveries';

    protected $fillable = [
        'delivery_id',
        'driver_id',
        'photo_url',
        'notes',
        'receiver_name',
        'captured_location',
        'created_by',
        'updated_by',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }
}
