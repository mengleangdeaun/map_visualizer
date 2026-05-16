<?php

namespace App\Events;

use App\Models\Driver\Task;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $task;

    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    public function broadcastOn()
    {
        $channels = [new PrivateChannel('fleet.' . $this->task->company_id)];

        if ($this->task->driver_id) {
            $channels[] = new PrivateChannel('App.Models.User.' . $this->task->driver_id);
        }

        return $channels;
    }

    public function broadcastAs()
    {
        return 'task.updated';
    }

    public function broadcastWith()
    {
        return [
            'task' => $this->task->load(['vehicle', 'driver']),
        ];
    }
}
