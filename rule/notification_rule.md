# Notification System & Asynchronous Architecture Rules

This document outlines the strict rules for dispatching alerts, real-time events, and background tasks. The system relies heavily on Laravel Cloud's infrastructure: **Octane**, **Reverb**, **Queue Workers**, and the **Task Scheduler**.

## 🚀 1. The Multi-Channel Notification Rule
All notifications must be designed to reach the user across multiple channels seamlessly. Do not write manual API calls (like `Http::post('telegram...')`) inside controllers. Always use Laravel's native Notification classes (`Illuminate\Notifications\Notification`).

A standard Notification class (e.g., `RouteAssignedNotification`) MUST route to:
1. **`database` (In-App History):** Saves the payload to the DB so the user sees an unread badge on their notification bell when they open the app.
2. **`broadcast` (Reverb Real-Time):** Pushes the event to the frontend via WebSockets. If the PWA/Admin panel is currently open, a toast popup appears instantly without reloading.
3. **`telegram` (External Bot):** Checks if the user has a `telegram_user_id`. If so, pushes an automated chat message.
4. **`webpush` (PWA Native):** Checks if the user has active `push_subscriptions`. If so, triggers a native OS notification (waking the phone up).

## ⏳ 2. Strict Queueing Mandate
**NEVER SEND NOTIFICATIONS SYNCHRONOUSLY.**
Every notification class MUST implement the `ShouldQueue` interface. 
- *Why?* Hitting the Telegram API or FCM (Firebase) takes ~200-500ms. If a dispatcher assigns 10 deliveries at once, waiting for external APIs will freeze their screen for 5 seconds.
- *How:* By queueing it, the HTTP response returns in <50ms (thanks to Octane), and the `artisan queue` worker running on your Laravel Cloud handles the external API calls silently in the background.

## 🔄 3. Laravel Reverb & Real-Time Sync
Because we are using Laravel Reverb:
- **Private Channels:** Ensure all driver notifications and telemetry use `PrivateChannel('user.{id}')` or `PrivateChannel('company.{id}')` to prevent data leakage.
- **Client-Side Action:** The frontend (PWA) must listen to these channels using Laravel Echo. When a notification event fires, the frontend should trigger TanStack Query to immediately refetch the latest data (e.g., `queryClient.invalidateQueries(['deliveries'])`), ensuring the UI is always perfectly synced with the database.

## ⏱️ 4. Task Scheduling (`artisan schedule`)
The `artisan schedule` (cron) is responsible for automated system oversight.
- **SLA Monitors:** The scheduler must run every 5 minutes to check the `delivery_time_windows` table. If a driver is about to miss a strict SLA delivery, the scheduler automatically dispatches a queued `SlaBreachWarningNotification` to the Dispatcher's Telegram group.
- **Automated Broadcasts:** If an admin schedules a Broadcast for 8:00 AM tomorrow, the scheduler picks it up and pushes it to the Queue at exactly 8:00 AM.
- **Telemetry Cleanup:** Schedule nightly jobs to archive old `driver_telemetry` rows, keeping the main PostgreSQL database blazing fast.

## 🛑 5. Octane Memory Leak Prevention
Because notifications and events are fired constantly, you must follow Octane safety rules.
- Do not store Notification instances or heavy payloads in static arrays or singletons.
- Trust the Queue to handle the memory lifecycle of these background jobs.
