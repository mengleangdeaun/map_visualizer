Key Findings
Route Status Typo (wasPublished): The $wasPublished check in RouteService.php checked if the status was !== 'optimized'. When dispatchers optimized routes before publishing them (the standard workflow), this check evaluated to false, which completely blocked the Reverb real-time broadcast and any notification triggers.
Missing Notification Triggers: While the templates for admin_publish_route and admin_assign_delivery were defined in DynamicActionNotification.php, they were never actually instantiated or dispatched during route publishing or driver assignment on the backend.
Driver Private Telegram Routing: In addition to fixing in-app alerts, we discovered we can route direct alerts to a driver's private telegram_chat_id (if configured on their user profile) when the company enables driver notifications, falling back to the company group chat as a default.
I have documented the complete architecture, draft modifications, and test coverage in the updated implementation plan: 👉 
implementation_plan.md

Please review the plan and let me know if you would like me to proceed with execution.

# Implementation Plan - Route Publishing & Delivery Assignment Notifications

This plan outlines the root cause analysis and technical implementation to resolve the issue where drivers do not receive notifications (either in-app or via Telegram) when an admin assigns deliveries and publishes routes via `/admin/fleet/dispatch`.

---

## 🔍 Root Cause Analysis

We have analyzed the backend dispatch, event, and notification layers, identifying three critical gaps:

1. **Typo in Route Status Transition Evaluation (`wasPublished`):**
   - In `app/Services/Delivery/RouteService.php` (line 63), `$wasPublished` is evaluated as:
     ```php
     $wasPublished = $route->status !== 'optimized' && ($data['status'] ?? null) === 'in_progress';
     ```
   - *The Bug:* A route is typically optimized by the dispatcher first (status changes from `'draft'` to `'optimized'`), and then published (status changes from `'optimized'` to `'in_progress'`). If `$route->status` was already `'optimized'`, then `$route->status !== 'optimized'` evaluates to `false`. As a result, `$wasPublished` evaluates to `false`, and neither the Echo broadcast nor any notifications trigger.
   - *The Fix:* Correct the status transition condition to check if the route status transitions from any non-`in_progress` status to `in_progress`:
     ```php
     $wasPublished = $route->status !== 'in_progress' && ($data['status'] ?? null) === 'in_progress';
     ```

2. **Missing Notification Class Dispatches:**
   - Although templates for `'admin_publish_route'` and `'admin_assign_delivery'` exist in `DynamicActionNotification.php`, they are **never actually dispatched** anywhere in the backend codebase during dispatch or publishing operations.

3. **Incomplete Telegram Direct Routing:**
   - Currently, `toTelegram` in `DynamicActionNotification.php` always defaults to routing alerts to either event-specific or company-wide public groups/chats. If the system is notifying a driver (`notify_driver_telegram` is enabled), it should target the driver's personal `telegram_chat_id` (and optional `telegram_topic_id`) when defined on their `User` model, falling back to the company chat otherwise.

---

## 🛠️ Proposed Changes

We will implement clean, queue-safe, robust modifications to both `RouteService.php` and `DynamicActionNotification.php`.

### 1. Delivery & Route Service Layer

#### [MODIFY] [RouteService.php](file:///c:/laragon/www/mapcn/app/Services/Delivery/RouteService.php)

- Correct `$wasPublished` evaluation.
- Add `$driverChanged` detection.
- When publishing or reassigning a route, dispatch `DynamicActionNotification` payloads alongside the Echo real-time broadcast:
  - **`admin_publish_route`**: Dispatch once per published route to summarize stop count and estimated distance.
  - **`admin_assign_delivery`**: Dispatch for each stop in the route to alert the driver of their specific tracking numbers, customer names, and drop-off addresses.

##### Draft Code Change:
```php
public function update(Route $route, array $data): Route
{
    $wasPublished = $route->status !== 'in_progress' && ($data['status'] ?? null) === 'in_progress';
    $driverChanged = isset($data['driver_id']) && $data['driver_id'] !== $route->driver_id;
    
    // Notify if either:
    // a) The route is being published and has an assigned driver
    // b) The route is already in progress and the driver is reassigned
    $shouldNotify = ($wasPublished && ($data['driver_id'] ?? $route->driver_id)) ||
                    (($route->status === 'in_progress' || ($data['status'] ?? null) === 'in_progress') && $driverChanged && $data['driver_id']);

    $route->update($data);

    // Synchronize driver_id and statuses down to deliveries
    $this->syncStopsToDeliveries($route);

    // Broadcast and dispatch multi-channel notifications
    if ($shouldNotify) {
        $route->refresh();
        $route->load(['driver', 'stops.delivery.order.customer']);

        if ($route->driver) {
            // 1. Broadcast Echo Event via Reverb (forces active map client refresh)
            event(new RouteAssignedToDriver($route));

            // 2. Dispatch Database/Broadcast/Telegram Notification for route publish
            $route->driver->notify(new \App\Notifications\DynamicActionNotification(
                'admin_publish_route',
                $route->company_id,
                [
                    'title' => 'New Route Dispatched',
                    'description' => "Admin published your route with {$route->stop_count} stops.",
                    'route_code' => $route->id,
                    'driver_name' => $route->driver->name,
                    'stops_count' => $route->stop_count,
                ]
            ));

            // 3. Dispatch Database/Broadcast/Telegram Notification for each assigned stop
            foreach ($route->stops as $stop) {
                if ($stop->delivery) {
                    $route->driver->notify(new \App\Notifications\DynamicActionNotification(
                        'admin_assign_delivery',
                        $route->company_id,
                        [
                            'title' => 'New Delivery Assigned',
                            'description' => "Delivery stop #{$stop->sequence_number} assigned to you.",
                            'tracking_number' => $stop->delivery->tracking_number,
                            'customer_name' => $stop->delivery->order?->customer?->name ?? 'Guest Customer',
                            'address' => $stop->delivery->dropoff_address,
                        ]
                    ));
                }
            }
        }
    }

    return $this->findById($route->id, $route->company_id);
}
```

---

### 2. Multi-Channel Notification Layer

#### [MODIFY] [DynamicActionNotification.php](file:///c:/laragon/www/mapcn/app/Notifications/DynamicActionNotification.php)

- Modify `toTelegram` to support intelligent driver private routing when `notify_driver_telegram` is enabled and the driver has registered their Telegram credentials.

##### Draft Code Change:
```php
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
```

---

## 🧪 Verification Plan

### Automated Verification
- Run code validation checking syntax and type constraints:
  - Verify zero PHP syntax errors.
  - Verify React compilation using `npm run build`.

### Manual / Integration Verification
- **Websocket Real-Time Verification:** Publish an optimized route from the `/admin/fleet/dispatch` screen, and verify that the driver's active map and delivery stops lists immediately reload and display the `New route assigned` toast.
- **In-App Notification Verification:** Go to the `/driver/notifications` page and verify that:
  - An `admin_publish_route` notification card is present.
  - Individual `admin_assign_delivery` cards are populated for each route stop.
- **Telegram Broadcast Verification:** Verify that:
  - If a driver's private `telegram_chat_id` is registered, the Telegram bot messages them directly.
  - Otherwise, the bot broadcasts the beautiful markdown templates to the default company chat group.
