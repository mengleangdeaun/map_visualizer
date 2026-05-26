<?php

namespace App\Notifications;

use App\Models\System\CompanyTelegramSettings;
use App\Channels\TelegramChannel;
use App\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DynamicActionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $actionKey;
    public array $payload;
    public string $companyId;
    public bool $isSilent = false;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $actionKey, string $companyId, array $payload, bool $isSilent = false)
    {
        $this->actionKey = $actionKey;
        $this->companyId = $companyId;
        $this->payload = $payload;
        $this->isSilent = $isSilent;
        $this->afterCommit = true;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        $channels = [];
        
        $settings = CompanyTelegramSettings::where('company_id', $this->companyId)->first();
        if (!$settings) {
            return $channels;
        }

        // 1. Database & Broadcast channel (PWA toast/notifications history)
        if ($settings->notify_pwa) {
            if (!$this->isSilent) {
                $channels[] = 'database';
                $channels[] = WebPushChannel::class;
            }
            $channels[] = 'broadcast';
        }

        // 2. Telegram Whitelist checks (Super Admin allowed_events & Company Admin enabled settings)
        $allowedEvents = $settings->allowed_events ?? [];
        $eventSettings = $settings->event_settings ?? [];

        // Check if the Super Admin whitelists this event AND the Company Admin enabled it
        $isWhitelisted = in_array($this->actionKey, $allowedEvents);
        $isEnabled = ($eventSettings[$this->actionKey]['enabled'] ?? true);

        if (!$this->isSilent && $isWhitelisted && $isEnabled && ($settings->notify_company_telegram || $settings->notify_driver_telegram)) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * Get the array representation of the notification for the database.
     */
    public function toDatabase($notifiable): array
    {
        return [
            'action' => $this->actionKey,
            'title' => $this->payload['title'] ?? 'DlvTrack Operational Update',
            'description' => $this->payload['description'] ?? 'An operational event has been logged.',
            'metadata' => $this->payload,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'action' => $this->actionKey,
            'title' => $this->payload['title'] ?? 'DlvTrack Operational Update',
            'description' => $this->payload['description'] ?? 'An operational event has been logged.',
            'metadata' => $this->payload,
        ]);
    }

    /**
     * Send Telegram messages via the custom channel.
     */
    public function toTelegram($notifiable): void
    {
        $settings = CompanyTelegramSettings::where('company_id', $this->companyId)->first();
        if (!$settings || !$settings->bot_token) {
            return;
        }

        // Resolve event settings and destination
        $eventSettings = $settings->event_settings ?? [];
        $actionSettings = $eventSettings[$this->actionKey] ?? null;

        $targetChatId = null;
        $targetTopicId = null;

        // Check if driver private telegram routing is allowed and credentials exist
        if ($settings->notify_driver_telegram && $notifiable instanceof \App\Models\User\User && $notifiable->role === 'driver' && $notifiable->telegram_chat_id) {
            $targetChatId = $notifiable->telegram_chat_id;
            $targetTopicId = $notifiable->telegram_topic_id;
        } else {
            // Fall back to custom action-specific chat or the company default group
            $targetChatId = $actionSettings['chat_id'] ?? $settings->company_chat_id;
            $targetTopicId = $actionSettings['topic_id'] ?? null;
        }

        if (!$targetChatId) {
            return;
        }

        $text = $this->formatMarkdownMessage();

        try {
            $payload = [
                'chat_id' => $targetChatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ];

            if ($targetTopicId) {
                $payload['message_thread_id'] = $targetTopicId;
            }

            Http::timeout(5)->post("https://api.telegram.org/bot{$settings->bot_token}/sendMessage", $payload);
        } catch (\Exception $e) {
            Log::error("Telegram Notification dispatch failed for action {$this->actionKey}: " . $e->getMessage());
        }
    }

    /**
     * Formats beautiful Emoji-rich Markdown templates depending on the actionKey.
     */
    protected function formatMarkdownMessage(): string
    {
        $p = $this->payload;

        switch ($this->actionKey) {
            case 'admin_announcement':
                return "📣 *ANNOUNCEMENT FROM MANAGEMENT*\n\n" . ($p['message'] ?? '');

            case 'admin_assign_task':
                return "📋 *NEW TASK ASSIGNED*\n\n"
                     . "• *Task ID*: `{$p['tracking_number']}`\n"
                     . "• *Title*: *{$p['title']}*\n"
                     . "• *Priority*: `{$p['priority']}`\n"
                     . "• *Address*: {$p['address']}";

            case 'admin_update_task':
                return "🔄 *TASK UPDATED*\n\n"
                     . "• *Task ID*: `{$p['tracking_number']}`\n"
                     . "• *Title*: *{$p['title']}*\n"
                     . "• *New Status*: `{$p['status']}`";

            case 'admin_assign_delivery':
                return "📦 *NEW DELIVERY ASSIGNED*\n\n"
                     . "• *Delivery ID*: `{$p['tracking_number']}`\n"
                     . "• *Customer*: *{$p['customer_name']}*\n"
                     . "• *Address*: {$p['address']}";

            case 'admin_update_delivery':
                return "🔄 *DELIVERY UPDATED*\n\n"
                     . "• *Delivery ID*: `{$p['tracking_number']}`\n"
                     . "• *New Status*: `{$p['status']}`";

            case 'admin_create_roadblock':
                return "⚠️ *ROAD BLOCK PLACED BY DISPATCH*\n\n"
                     . "• *Hazard Type*: `{$p['hazard_type']}`\n"
                     . "• *Description*: {$p['description']}";

            case 'admin_publish_route':
                return "🗺️ *FLEET ROUTE DISPATCHED*\n\n"
                     . "• *Route Code*: `{$p['route_code']}`\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Stops Dispatched*: `{$p['stops_count']}`";

            case 'driver_start_shift':
                return "🟢 *SHIFT STARTED*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Vehicle*: `{$p['plate_number']}`\n"
                     . "• *Time*: " . now()->format('H:i:s');

            case 'driver_end_shift':
                return "🔴 *SHIFT ENDED*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Vehicle*: `{$p['plate_number']}`\n"
                     . "• *Time*: " . now()->format('H:i:s');

            case 'driver_start_task':
                return "🚀 *DRIVER STARTED TASK*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Task ID*: `{$p['tracking_number']}`\n"
                     . "• *Title*: *{$p['title']}*";

            case 'driver_update_task':
                return "📝 *DRIVER UPDATED TASK*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Task ID*: `{$p['tracking_number']}`\n"
                     . "• *New Status*: `{$p['status']}`";

            case 'driver_start_delivery':
                return "🚀 *DRIVER STARTED DELIVERY*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Delivery ID*: `{$p['tracking_number']}`\n"
                     . "• *Customer*: *{$p['customer_name']}*";

            case 'driver_update_delivery':
                return "📝 *DRIVER UPDATED DELIVERY*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Delivery ID*: `{$p['tracking_number']}`\n"
                     . "• *New Status*: `{$p['status']}`";

            case 'driver_create_roadblock':
                return "⚠️ *ROAD ALERT REPORTED BY DRIVER*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Hazard Type*: `{$p['hazard_type']}`\n"
                     . "• *Description*: {$p['description']}";

            case 'driver_log_exception':
                return "🚨 *DELIVERY ISSUE LOGGED (EXCEPTION)*\n\n"
                     . "• *Driver*: *{$p['driver_name']}*\n"
                     . "• *Delivery ID*: `{$p['tracking_number']}`\n"
                     . "• *Issue Category*: `{$p['issue_type']}`\n"
                     . "• *Notes*: {$p['notes']}";

            default:
                return "🔔 *DLVTRACK OPERATIONAL EVENT*\n\n"
                     . "• *Event*: `{$this->actionKey}`\n"
                     . "• *Message*: " . ($p['description'] ?? 'No additional details provided.');
        }
    }
}
