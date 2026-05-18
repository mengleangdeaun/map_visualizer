<?php

namespace App\Events\Delivery;

use App\Models\Delivery\RoadAlert;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class RoadAlertCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $alertData;

    public function __construct(RoadAlert $alert)
    {
        // Parse coordinates from PostGIS POINT geometry
        $coords = DB::selectOne(
            "SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM road_alerts WHERE id = ?",
            [$alert->id]
        );

        $this->alertData = [
            'id' => $alert->id,
            'company_id' => $alert->company_id,
            'description' => $alert->description,
            'type' => $alert->type,
            'lng' => $coords ? (float) $coords->lng : null,
            'lat' => $coords ? (float) $coords->lat : null,
            'created_at' => $alert->created_at->toIso8601String(),
            'creator_name' => $alert->creator ? $alert->creator->name : 'Dispatch Center',
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('company.' . $this->alertData['company_id']),
        ];
    }

    public function broadcastAs(): string
    {
        return 'road-alert.created';
    }
}
