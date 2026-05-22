<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\System\CompanyTelegramSettings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CompanyTelegramRulesController extends Controller
{
    /**
     * Get the Telegram configurations and action settings for the logged-in company admin.
     * Only whitelisted events (allowed_events) are exposed.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->company_id) {
            return response()->json(['message' => 'Unauthorized: user does not belong to any company.'], 403);
        }

        $settings = CompanyTelegramSettings::firstOrCreate(
            ['company_id' => $user->company_id],
            [
                'bot_token' => null,
                'company_chat_id' => null,
                'notify_pwa' => true,
                'notify_driver_telegram' => true,
                'notify_company_telegram' => true,
                'event_settings' => [],
                'allowed_events' => [],
            ]
        );

        // Ensure allowed_events and event_settings are initialized
        $allowedEvents = $settings->allowed_events ?? [];
        $eventSettings = $settings->event_settings ?? [];

        // Filter event_settings so we only return the ones whitelisted by the Super Admin
        $filteredSettings = [];
        foreach ($allowedEvents as $event) {
            $filteredSettings[$event] = $eventSettings[$event] ?? [
                'enabled' => true,
                'chat_id' => null,
                'topic_id' => null,
            ];
        }

        return response()->json([
            'settings' => $settings,
            'allowed_events' => $allowedEvents,
            'event_settings' => $filteredSettings,
        ]);
    }

    /**
     * Update event configurations for the company admin.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->company_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $settings = CompanyTelegramSettings::where('company_id', $user->company_id)->firstOrFail();
        $allowedEvents = $settings->allowed_events ?? [];

        $request->validate([
            'event_settings' => 'required|array',
            'notify_pwa' => 'required|boolean',
            'notify_driver_telegram' => 'required|boolean',
            'notify_company_telegram' => 'required|boolean',
        ]);

        $inputEventSettings = $request->input('event_settings');
        $updatedEventSettings = $settings->event_settings ?? [];

        // Only update configuration keys that are whitelisted in allowed_events
        foreach ($allowedEvents as $event) {
            if (isset($inputEventSettings[$event]) && is_array($inputEventSettings[$event])) {
                $updatedEventSettings[$event] = [
                    'enabled' => (bool) ($inputEventSettings[$event]['enabled'] ?? true),
                    'chat_id' => $inputEventSettings[$event]['chat_id'] ?? null,
                    'topic_id' => $inputEventSettings[$event]['topic_id'] ?? null,
                ];
            }
        }

        $settings->update([
            'notify_pwa' => $request->input('notify_pwa'),
            'notify_driver_telegram' => $request->input('notify_driver_telegram'),
            'notify_company_telegram' => $request->input('notify_company_telegram'),
            'event_settings' => $updatedEventSettings,
        ]);

        return response()->json([
            'message' => 'Notification rules updated successfully.',
            'event_settings' => $updatedEventSettings,
        ]);
    }

    /**
     * Dispatch a mock Telegram test message for a specific action.
     */
    public function testAction(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->company_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'action' => 'required|string',
        ]);

        $action = $request->input('action');
        $settings = CompanyTelegramSettings::where('company_id', $user->company_id)->firstOrFail();

        // 1. Super Admin Guard: Verify the action is permitted
        $allowedEvents = $settings->allowed_events ?? [];
        if (!in_array($action, $allowedEvents)) {
            return response()->json([
                'success' => false,
                'message' => "The action '{$action}' is disabled by the Super Admin for your company."
            ], 403);
        }

        // 2. Validate Bot Credentials
        if (!$settings->bot_token) {
            return response()->json([
                'success' => false,
                'message' => 'No Telegram Bot Token configured. Please save a valid bot token first.'
            ], 422);
        }

        // 3. Resolve target action settings
        $actionSettings = ($settings->event_settings ?? [])[$action] ?? null;
        $enabled = $actionSettings['enabled'] ?? true;
        if (!$enabled) {
            return response()->json([
                'success' => false,
                'message' => 'This action is currently toggled OFF in your configurations.'
            ], 422);
        }

        $targetChatId = $actionSettings['chat_id'] ?? $settings->company_chat_id;
        $targetTopicId = $actionSettings['topic_id'] ?? null;

        if (!$targetChatId) {
            return response()->json([
                'success' => false,
                'message' => 'No Telegram Chat ID configured for this action or as a company default.'
            ], 422);
        }

        // 4. Construct beautiful Markdown notification payload depending on action
        $formattedAction = str_replace('_', ' ', strtoupper($action));
        $text = "🔔 *DlvTrack Action Integration Test*\n\n"
              . "⚡ *Triggered Action*: `{$formattedAction}`\n"
              . "👤 *Initiated By*: {$user->name} (Admin)\n"
              . "📡 *Status*: Live Connection Verified 🟢\n"
              . "🕒 *Timestamp*: " . now()->format('Y-m-d H:i:s') . "\n\n"
              . "• *Routing Channel*: " . ($actionSettings['chat_id'] ? "Custom Action Group" : "Default Company Chat") . "\n";
        
        if ($targetTopicId) {
            $text .= "• *Supergroup Topic Thread ID*: `{$targetTopicId}`\n";
        }
        
        $text .= "\nThis simulated payload confirms your event routing rules are perfectly set up!";

        // 5. Post to Telegram API
        try {
            $payload = [
                'chat_id' => $targetChatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ];

            if ($targetTopicId) {
                $payload['message_thread_id'] = $targetTopicId;
            }

            $response = Http::timeout(5)->post("https://api.telegram.org/bot{$settings->bot_token}/sendMessage", $payload);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => "Test alert for '{$action}' successfully delivered to Telegram!"
                ]);
            }

            $error = $response->json()['description'] ?? 'Bad Request';
            return response()->json([
                'success' => false,
                'message' => "Telegram API returned error: {$error}"
            ], 400);

        } catch (\Exception $e) {
            Log::error("Telegram Action Test failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Connection to Telegram failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
