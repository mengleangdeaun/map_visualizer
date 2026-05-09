<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $latitude;
    public $longitude;
    public $heading;
    public $speed;
    public $vehicleId;

    public function __construct($latitude, $longitude, $heading, $speed, $vehicleId)
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->heading = $heading;
        $this->speed = $speed;
        $this->vehicleId = $vehicleId;
    }

    public function broadcastOn()
    {
        return new Channel('telemetry.123');
    }

    public function broadcastAs()
    {
        return 'vehicle.location.updated';
    }

    public function broadcastWith()
    {
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'heading' => $this->heading,
            'speed' => $this->speed,
            'vehicle_id' => $this->vehicleId,
            'timestamp' => now()->toIso8601String()
        ];
    }
}
