<?php

namespace App\Events\Delivery;

use App\Models\Delivery\Route;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RouteAssignedToDriver implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Route $route) {}

    /**
     * Broadcast on the driver's private channel so only they receive it.
     */
    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('driver.' . $this->route->driver_id);
    }

    public function broadcastAs(): string
    {
        return 'route.assigned';
    }

    public function broadcastWith(): array
    {
        $stops = $this->route->stops()->with('delivery')->get()->map(function ($stop) {
            $delivery = $stop->delivery;
            return [
                'id'              => $stop->id,
                'sequence_number' => $stop->sequence_number,
                'eta'             => $stop->eta?->toIso8601String(),
                'status'          => $stop->status,
                'leg_distance_km' => $stop->leg_distance_km,
                'leg_duration_min'=> $stop->leg_duration_min,
                'delivery'        => $delivery ? [
                    'id'              => $delivery->id,
                    'tracking_number' => $delivery->tracking_number,
                    'dropoff_address' => $delivery->dropoff_address,
                    'status'          => $delivery->status,
                ] : null,
            ];
        });

        return [
            'route' => [
                'id'                     => $this->route->id,
                'date'                   => $this->route->date->toDateString(),
                'status'                 => $this->route->status,
                'stop_count'             => $this->route->stop_count,
                'estimated_distance_km'  => $this->route->estimated_distance_km,
                'estimated_duration_min' => $this->route->estimated_duration_min,
                'stops'                  => $stops,
            ],
        ];
    }
}
