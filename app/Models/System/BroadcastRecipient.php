<?php

namespace App\Models\System;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BroadcastRecipient extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'broadcast_recipients';

    protected $fillable = [
        'broadcast_id',
        'user_id',
        'status', // pending, delivered, failed, read
        'error_message',
    ];

    /**
     * Get the broadcast associated with the recipient.
     */
    public function broadcast()
    {
        return $this->belongsTo(Broadcast::class);
    }

    /**
     * Get the user (driver) associated with the recipient.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
