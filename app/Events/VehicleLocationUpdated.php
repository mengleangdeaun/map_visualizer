<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $latitude;
    public $longitude;
    public $heading;
    public $speed;
    public $vehicleId;
    public $companyId;
    public $maxSpeedKmh;

    public function __construct($latitude, $longitude, $heading, $speed, $vehicleId, $companyId = null, $maxSpeedKmh = 60)
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->heading = $heading;
        $this->speed = $speed;
        $this->vehicleId = $vehicleId;
        $this->companyId = $companyId;
        $this->maxSpeedKmh = $maxSpeedKmh;
    }

    public function broadcastOn()
    {
        if ($this->companyId) {
            return new \Illuminate\Broadcasting\PrivateChannel('fleet.' . $this->companyId);
        }
        return new \Illuminate\Broadcasting\Channel('telemetry.public');
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
            'max_speed_kmh' => $this->maxSpeedKmh,
            'timestamp' => now()->toIso8601String()
        ];
    }
}
