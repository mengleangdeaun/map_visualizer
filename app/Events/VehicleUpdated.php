<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $telemetry;

    public function __construct($telemetry)
    {
        $this->telemetry = $telemetry;
    }

    public function broadcastOn()
    {
        return new Channel('telemetry.123');
    }

    public function broadcastAs()
    {
        return 'VehicleUpdated';
    }
}
