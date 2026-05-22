<?php

namespace App\Models\System;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'broadcasts';

    protected $fillable = [
        'company_id',
        'author_id',
        'message',
        'channel', // telegram, pwa_push, both
        'target_audience', // all_drivers, active_drivers, specific_hub, specific_users
        'target_hub_id',
        'status', // draft, sending, completed, failed
        'success_count',
        'scheduled_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'success_count' => 'integer',
    ];

    /**
     * Get the company that owns the broadcast.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the author (user) who created the broadcast.
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Get the recipients associated with the broadcast.
     */
    public function recipients()
    {
        return $this->hasMany(BroadcastRecipient::class);
    }
}
