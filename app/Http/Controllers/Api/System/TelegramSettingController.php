<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Models\System\Company;
use App\Models\System\CompanyTelegramSettings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class TelegramSettingController extends Controller
{
    /**
     * Get or initialize the telegram settings for a company.
     */
    public function show(string $companyId): JsonResponse
    {
        $company = Company::findOrFail($companyId);
        
        $defaultEvents = [
            'admin_announcement',
            'admin_assign_task',
            'admin_update_task',
            'admin_assign_delivery',
            'admin_update_delivery',
            'admin_create_roadblock',
            'admin_publish_route',
            'driver_start_shift',
            'driver_end_shift',
            'driver_start_task',
            'driver_update_task',
            'driver_start_delivery',
            'driver_update_delivery',
            'driver_create_roadblock',
            'driver_log_exception'
        ];

        $defaultEventSettings = [];
        foreach ($defaultEvents as $event) {
            $defaultEventSettings[$event] = [
                'enabled' => true,
                'chat_id' => null,
                'topic_id' => null,
            ];
        }

        $settings = CompanyTelegramSettings::firstOrCreate(
            ['company_id' => $company->id],
            [
                'bot_token' => null,
                'company_chat_id' => null,
                'notify_pwa' => true,
                'notify_driver_telegram' => true,
                'notify_company_telegram' => true,
                'event_settings' => $defaultEventSettings,
                'allowed_events' => $defaultEvents,
            ]
        );

        // Ensure backward compatibility for existing records without these columns
        if (is_null($settings->allowed_events)) {
            $settings->update([
                'allowed_events' => $defaultEvents,
                'event_settings' => $settings->event_settings ?? $defaultEventSettings
            ]);
        }

        return response()->json($settings);
    }

    /**
     * Update the telegram settings.
     */
    public function update(Request $request, string $companyId): JsonResponse
    {
        $company = Company::findOrFail($companyId);
        $settings = CompanyTelegramSettings::where('company_id', $company->id)->firstOrFail();

        $validated = $request->validate([
            'bot_token' => 'nullable|string|max:255',
            'company_chat_id' => 'nullable|string|max:255',
            'notify_pwa' => 'required|boolean',
            'notify_driver_telegram' => 'required|boolean',
            'notify_company_telegram' => 'required|boolean',
            'allowed_events' => 'nullable|array',
            'allowed_events.*' => 'string',
        ]);

        if (!empty($validated['bot_token'])) {
            try {
                $res = Http::timeout(3)->get("https://api.telegram.org/bot{$validated['bot_token']}/getMe");
                if ($res->successful()) {
                    $resData = $res->json();
                    $validated['bot_username'] = $resData['result']['username'] ?? null;
                    $validated['bot_name'] = $resData['result']['first_name'] ?? null;
                }
            } catch (\Exception $e) {
                // Fallback to existing or keep null
            }
        } else {
            $validated['bot_username'] = null;
            $validated['bot_name'] = null;
        }

        $settings->update($validated);

        return response()->json([
            'message' => 'Telegram settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * Live test connection of the Telegram Bot via /getMe.
     */
    public function testBot(Request $request, string $companyId): JsonResponse
    {
        $company = Company::findOrFail($companyId);
        $settings = CompanyTelegramSettings::where('company_id', $company->id)->firstOrFail();

        $token = $request->input('bot_token') ?? $settings->bot_token;

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'No Bot Token configured or provided for testing'
            ], 422);
        }

        try {
            $response = Http::timeout(5)->get("https://api.telegram.org/bot{$token}/getMe");

            if ($response->successful()) {
                $data = $response->json();
                $botUsername = $data['result']['username'] ?? null;
                $botFirstName = $data['result']['first_name'] ?? null;

                // Persist the details if they match the saved token
                if ($token === $settings->bot_token) {
                    $settings->update([
                        'bot_username' => $botUsername,
                        'bot_name' => $botFirstName
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Connected successfully!',
                    'bot' => [
                        'id' => $data['result']['id'] ?? null,
                        'first_name' => $botFirstName,
                        'username' => $botUsername,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to connect. Telegram API returned: ' . ($response->json()['description'] ?? 'Unauthorized')
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection timed out or failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a live test message to the company chat ID.
     */
    public function testMessage(Request $request, string $companyId): JsonResponse
    {
        $company = Company::findOrFail($companyId);
        $settings = CompanyTelegramSettings::where('company_id', $company->id)->firstOrFail();

        $token = $request->input('bot_token') ?? $settings->bot_token;
        $chatId = $request->input('company_chat_id') ?? $settings->company_chat_id;

        if (!$token || !$chatId) {
            return response()->json([
                'success' => false,
                'message' => 'Bot Token and Chat ID must be configured'
            ], 422);
        }

        $text = "🔔 *DlvTrack Bot Integration Test*\n\n"
              . "This is a live test message sent from the *System Administration Dashboard* to verify successful routing.\n\n"
              . "• *Status*: Active 🟢\n"
              . "• *Time*: " . now()->format('Y-m-d H:i:s') . " (Server Time)\n\n"
              . "Thank you for using DlvTrack!";

        try {
            $response = Http::timeout(5)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test message sent successfully!'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message: ' . ($response->json()['description'] ?? 'Bad Request')
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage()
            ], 500);
        }
    }
}
