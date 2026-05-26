<?php

namespace App\Notifications;

use App\Models\Driver\Task;
use App\Models\System\CompanyTelegramSettings;
use App\Channels\TelegramChannel;
use App\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewTaskNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $task;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task)
    {
        $this->task = $task;
        $this->afterCommit = true;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        $channels = [];
        
        $settings = CompanyTelegramSettings::where('company_id', $this->task->company_id)->first();
        
        if ($settings) {
            // PWA Channel
            if ($settings->notify_pwa && $this->task->driver_id) {
                $channels[] = 'database';
                $channels[] = 'broadcast';
                $channels[] = WebPushChannel::class;
            }
            
            // Telegram Channel (handles both driver and company dispatches)
            if ($settings->notify_driver_telegram || $settings->notify_company_telegram) {
                $channels[] = TelegramChannel::class;
            }
        }
        
        return $channels;
    }

    /**
     * Get the array representation of the notification for the database.
     */
    public function toDatabase($notifiable): array
    {
        $coords = $this->getCoordinates($this->task->pickup_location ?: $this->task->dropoff_location, $this->task->pickup_lat ?: $this->task->dropoff_lat, $this->task->pickup_lng ?: $this->task->dropoff_lng);
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'description' => $this->task->description,
            'priority' => $this->task->priority ?? 'normal',
            'status' => $this->task->status,
            'scheduled_at' => $this->task->scheduled_at,
            'lat' => $coords ? $coords['lat'] : null,
            'lng' => $coords ? $coords['lng'] : null,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast($notifiable): BroadcastMessage
    {
        $coords = $this->getCoordinates($this->task->pickup_location ?: $this->task->dropoff_location, $this->task->pickup_lat ?: $this->task->dropoff_lat, $this->task->pickup_lng ?: $this->task->dropoff_lng);
        return new BroadcastMessage([
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'priority' => $this->task->priority ?? 'normal',
            'status' => $this->task->status,
            'lat' => $coords ? $coords['lat'] : null,
            'lng' => $coords ? $coords['lng'] : null,
        ]);
    }

    /**
     * Send Telegram messages via the custom channel.
     */
    public function toTelegram($notifiable): void
    {
        $settings = CompanyTelegramSettings::where('company_id', $this->task->company_id)->first();
        if (!$settings || !$settings->bot_token) {
            return;
        }

        // 1. Send Company Telegram Alert
        if ($settings->notify_company_telegram && $settings->company_chat_id) {
            $this->sendCompanyNotification($settings);
        }

        // 2. Send Driver Telegram Alert (if notifiable has telegram details)
        if ($settings->notify_driver_telegram && isset($notifiable->telegram_chat_id) && $notifiable->telegram_chat_id) {
            $this->sendDriverNotification($settings, $notifiable);
        }
    }

    /**
     * Parse coordinates from a location string/object or explicit properties.
     */
    protected function getCoordinates($location, ?float $explicitLat = null, ?float $explicitLng = null): ?array
    {
        // 1. Explicit attributes (if already selected and present)
        if ($explicitLat !== null && $explicitLng !== null) {
            return ['lat' => $explicitLat, 'lng' => $explicitLng];
        }

        // 2. Parse from WKT point string "POINT(lng lat)" or "POINT (lng lat)"
        if (is_string($location) && preg_match('/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i', $location, $matches)) {
            return [
                'lat' => (float) $matches[2], // Second coordinate is Latitude
                'lng' => (float) $matches[1], // First coordinate is Longitude
            ];
        }

        // 3. Fallback: if it's hex-encoded EWKB
        if (is_string($location)) {
            // Strip PostgreSQL hex prefix if present
            if (str_starts_with($location, '\x')) {
                $location = substr($location, 2);
            } elseif (str_starts_with($location, 'x')) {
                $location = substr($location, 1);
            }

            if (preg_match('/^[0-9a-fA-F]{32,50}$/', $location)) {
                try {
                    $binary = pack('H*', $location);
                    if (strlen($binary) >= 21) {
                        $isLittleEndian = ord($binary[0]) === 1;
                        $hasSrid = $isLittleEndian ? (bool) (ord($binary[4]) & 0x20) : (bool) (ord($binary[1]) & 0x20);
                        $offset = $hasSrid ? 9 : 5; // skip header bytes (geometry type & optional SRID)
                        $data = unpack('d2', substr($binary, $offset));
                        if ($data) {
                            return [
                                'lat' => $data[2], // Second double is Latitude
                                'lng' => $data[1], // First double is Longitude
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Hex EWKB parse error: ' . $e->getMessage());
                }
            }
        }

        return null;
    }

    /**
     * Format a location label and its coordinates into a clickable Google Maps link.
     */
    protected function formatLocationLink(?string $address, $location, ?float $explicitLat = null, ?float $explicitLng = null): string
    {
        $coords = $this->getCoordinates($location, $explicitLat, $explicitLng);

        if ($coords) {
            $lat = $coords['lat'];
            $lng = $coords['lng'];
            $label = $address ?: "{$lat}, {$lng}";
            // Escape special markdown characters inside the label
            $label = str_replace(['[', ']'], ['', ''], $label);
            return "[{$label}](https://www.google.com/maps/search/?api=1&query={$lat},{$lng})";
        }
        
        return $address ?: 'Not Specified';
    }

    /**
     * Send markdown notification to the Company Telegram Group.
     */
    protected function sendCompanyNotification(CompanyTelegramSettings $settings): void
    {
        $driverName = $this->task->driver ? $this->task->driver->name : '*Unassigned*';
        $pickup = $this->formatLocationLink($this->task->pickup_address, $this->task->pickup_location, $this->task->pickup_lat, $this->task->pickup_lng);
        $dropoff = $this->formatLocationLink($this->task->dropoff_address, $this->task->dropoff_location, $this->task->dropoff_lat, $this->task->dropoff_lng);
        $scheduled = $this->task->scheduled_at ? $this->task->scheduled_at->format('Y-m-d H:i') : 'Immediate';
        $priority = strtoupper($this->task->priority ?: 'normal');

        $text = "📦 *New Errand Dispatched!*\n\n"
              . "• *Task*: {$this->task->title}\n"
              . "• *Priority*: `{$priority}` ⚠️\n"
              . "• *Assignee*: {$driverName} 👤\n"
              . "• *Pickup*: {$pickup} 📍\n"
              . "• *Dropoff*: {$dropoff} 🏁\n"
              . "• *Scheduled*: {$scheduled} ⏰\n\n"
              . "Manage live details on the dispatch dashboard.";

        try {
            Http::timeout(5)->post("https://api.telegram.org/bot{$settings->bot_token}/sendMessage", [
                'chat_id' => $settings->company_chat_id,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ]);
        } catch (\Exception $e) {
            Log::error('Telegram Company notification fail: ' . $e->getMessage());
        }
    }

    /**
     * Send markdown notification to the Driver's custom Telegram Chat / Forum Topic.
     */
    protected function sendDriverNotification(CompanyTelegramSettings $settings, $driver): void
    {
        $pickup = $this->formatLocationLink($this->task->pickup_address, $this->task->pickup_location, $this->task->pickup_lat, $this->task->pickup_lng);
        $dropoff = $this->formatLocationLink($this->task->dropoff_address, $this->task->dropoff_location, $this->task->dropoff_lat, $this->task->dropoff_lng);
        $scheduled = $this->task->scheduled_at ? $this->task->scheduled_at->format('Y-m-d H:i') : 'Immediate';
        $priority = strtoupper($this->task->priority ?: 'normal');

        $text = "📋 *New Task Assigned to You!*\n\n"
              . "Hi {$driver->name}, a new errand has been assigned to your active queue:\n\n"
              . "• *Task*: {$this->task->title}\n"
              . "• *Priority*: `{$priority}` ⚡\n"
              . "• *Pickup*: {$pickup} 📍\n"
              . "• *Dropoff*: {$dropoff} 🏁\n"
              . "• *Scheduled*: {$scheduled} ⏰\n\n"
              . "Please open your app to view and accept this task.";

        $payload = [
            'chat_id' => $driver->telegram_chat_id,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ];

        // Support supergroup forum thread topics!
        if (isset($driver->telegram_topic_id) && $driver->telegram_topic_id) {
            $payload['message_thread_id'] = $driver->telegram_topic_id;
        }

        try {
            Http::timeout(5)->post("https://api.telegram.org/bot{$settings->bot_token}/sendMessage", $payload);
        } catch (\Exception $e) {
            Log::error('Telegram Driver notification fail: ' . $e->getMessage());
        }
    }
}
