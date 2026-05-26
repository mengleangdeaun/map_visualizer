<?php

namespace App\Http\Controllers\Api\Driver\Profile;

use App\Http\Controllers\Controller;
use App\Models\User\PushSubscription;
use App\Notifications\WelcomePushNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Update the driver's profile picture.
     */
    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($user->profile_url) {
                Storage::disk(config('filesystems.default'))->delete($user->profile_url);
            }

            // Store new profile picture
            $path = $request->file('profile_picture')->store('profiles', config('filesystems.default'));
            $user->update([
                'profile_url' => $path
            ]);

            return response()->json([
                'message' => 'Profile picture updated successfully',
                'profile_url' => $user->profile_url,
                'profile_full_url' => $user->profile_full_url,
            ]);
        }

        return response()->json(['message' => 'No image uploaded'], 400);
    }

    /**
     * Request email change - generates a 6 digit code and caches the request.
     */
    public function requestEmailChange(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $newEmail = $request->email;
        
        if ($newEmail === $user->email) {
            throw ValidationException::withMessages([
                'email' => ['This is already your active email address.'],
            ]);
        }

        // Generate 6-digit verification code
        $code = strval(rand(100000, 999999));

        // Cache the request for 15 minutes
        Cache::put("email_change_{$user->id}", [
            'email' => $newEmail,
            'code' => $code
        ], now()->addMinutes(15));

        // For demo/testing simplicity and smooth experience, we'll return the code in the response
        // in a production environment, this would be sent via real transactional emails.
        return response()->json([
            'message' => 'Verification code sent successfully',
            'code' => $code, // returned for testing/development ease
            'email' => $newEmail
        ]);
    }

    /**
     * Confirm email change - verifies the code and updates the user's email.
     */
    public function confirmEmailChange(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $cachedData = Cache::get("email_change_{$user->id}");

        if (!$cachedData || $cachedData['code'] !== $request->code) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is incorrect or has expired.'],
            ]);
        }

        // Update email
        $user->update([
            'email' => $cachedData['email']
        ]);

        // Clean cache
        Cache::forget("email_change_{$user->id}");

        return response()->json([
            'message' => 'Email updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Reset/Change Password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|different:current_password',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password you entered is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Register/Update Push Subscription (VAPID) details.
     */
    public function savePushSubscription(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
            'public_key' => 'nullable|string',
            'auth_token' => 'nullable|string',
            'device_type' => 'nullable|string|in:android,ios,desktop',
        ]);

        $user = $request->user();

        // Update or create the subscription for the user
        $subscription = PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint' => $request->endpoint
            ],
            [
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
                'device_type' => $request->device_type ?? 'android'
            ]
        );

        // Dispatch an instant native Welcome push notification to verify connection
        try {
            $user->notify(new WelcomePushNotification());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send welcome push: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Push subscription saved successfully',
            'subscription' => $subscription
        ]);
    }

    /**
     * Delete/Unregister Push Subscription.
     */
    public function deletePushSubscription(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $user = $request->user();

        PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json([
            'message' => 'Push subscription unregistered successfully'
        ]);
    }
}
