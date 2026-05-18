<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;

class TelegramChannel
{
    /**
     * Send the given notification.
     */
    public function send($notifiable, Notification $notification): void
    {
        if (method_exists($notification, 'toTelegram')) {
            $notification->toTelegram($notifiable);
        }
    }
}
