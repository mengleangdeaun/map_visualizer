<?php

namespace App\Notifications;

use App\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WelcomePushNotification extends Notification
{
    use Queueable;

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    /**
     * Get the WebPush representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toWebPush($notifiable): array
    {
        return [
            'title' => 'System Connected! 🔔',
            'description' => 'Welcome to SCCG Alerts! You will now receive real-time task dispatches and route updates here.',
            'message' => 'Welcome to SCCG Alerts! You will now receive real-time task dispatches and route updates here.',
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable): array
    {
        return [
            'title' => 'System Connected! 🔔',
            'description' => 'Welcome to SCCG Alerts! You will now receive real-time task dispatches and route updates here.',
        ];
    }
}
