<?php

namespace App\Services\Notification;

use App\Models\Driver\Task;
use App\Notifications\NewTaskNotification;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Dispatch queueable multi-channel notification for a newly created task.
     */
    public function notifyNewTask(Task $task): void
    {
        if ($task->driver) {
            // Send fully queued notification to driver
            $task->driver->notify(new NewTaskNotification($task));
        } else {
            // If no driver assigned, dispatch via anonymous routing to trigger Company Telegram dispatch
            Notification::route(\App\Channels\TelegramChannel::class, $task)
                ->notify(new NewTaskNotification($task));
        }
    }
}
