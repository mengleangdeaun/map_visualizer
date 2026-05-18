<?php

namespace App\Models\Delivery;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProofOfDelivery extends Model
{
    use HasFactory, HasUlids;

    // Explicitly set table since database has it as plural
    protected $table = 'proof_of_deliveries';

    protected $fillable = [
        'delivery_id',
        'photo_path',
        'notes',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }
}
