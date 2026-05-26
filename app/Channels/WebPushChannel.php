<?php

namespace App\Channels;

use App\Models\User\PushSubscription;
use Illuminate\Notifications\Notification;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class WebPushChannel
{
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification): void
    {
        $subscriptions = PushSubscription::where('user_id', $notifiable->id)->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        if (method_exists($notification, 'toWebPush')) {
            $payload = $notification->toWebPush($notifiable);
        } elseif (method_exists($notification, 'toDatabase')) {
            $payload = $notification->toDatabase($notifiable);
        } else {
            $payload = $notification->toArray($notifiable);
        }

        $data = [
            'title' => $payload['title'] ?? 'SCCG Update',
            'body' => $payload['description'] ?? $payload['message'] ?? 'You have a new update.',
            'data' => $payload,
        ];

        $payloadJson = json_encode($data);

        $auth = [
            'VAPID' => [
                'subject' => config('services.vapid.subject', 'mailto:admin@example.com'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ];

        try {
            $webPush = new WebPush($auth);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->public_key,
                        'authToken' => $sub->auth_token,
                    ]),
                    $payloadJson
                );
            }

            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getEndpoint();
                if (!$report->isSuccess()) {
                    Log::warning("WebPush failed to send for endpoint: {$endpoint}. Error: {$report->getReason()}");
                    
                    if (in_array($report->getStatusCode(), [404, 410])) {
                        PushSubscription::where('endpoint', $endpoint)->delete();
                        Log::info("Deleted expired push subscription for endpoint: {$endpoint}");
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('WebPush Channel Error: ' . $e->getMessage());
        }
    }
}
