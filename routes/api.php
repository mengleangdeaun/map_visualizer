<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [\App\Http\Controllers\Api\Auth\AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [\App\Http\Controllers\Api\Auth\AuthController::class, 'me']);
    Route::post('/logout', [\App\Http\Controllers\Api\Auth\AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // System Domain (Super Admin)
    Route::prefix('system')->group(function () {
        Route::apiResource('companies', \App\Http\Controllers\Api\System\Company\CompanyController::class);
        Route::apiResource('users', \App\Http\Controllers\Api\System\User\UserController::class);
        Route::apiResource('exchange-rates', \App\Http\Controllers\Api\System\ExchangeRate\ExchangeRateController::class);
        
        Route::get('companies/{company}/telegram-settings', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'show']);
        Route::put('companies/{company}/telegram-settings', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'update']);
        Route::post('companies/{company}/telegram-settings/test-bot', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'testBot']);
        Route::post('companies/{company}/telegram-settings/test-message', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'testMessage']);
    });

    // Fleet Domain
    Route::prefix('fleet')->group(function () {
        Route::apiResource('locations', \App\Http\Controllers\Api\Fleet\Location\LocationController::class);
    });

    // Admin Domain (Company Admin / Dispatcher)
    Route::prefix('admin')->group(function () {
        Route::prefix('fleet')->group(function () {
            Route::apiResource('vehicles', \App\Http\Controllers\Api\Admin\Fleet\VehicleController::class);
            Route::apiResource('tasks', \App\Http\Controllers\Api\Admin\Fleet\TaskController::class);
            Route::apiResource('customers', \App\Http\Controllers\Api\Admin\Customer\CustomerController::class);
            Route::patch('vehicles/active/location', [\App\Http\Controllers\Api\Admin\Fleet\VehicleController::class, 'updateActiveLocation']);
            Route::patch('vehicles/{vehicle}/location', [\App\Http\Controllers\Api\Admin\Fleet\VehicleController::class, 'updateLocation']);
        });
    });

    // Driver Domain
    Route::prefix('driver')->group(function () {
        Route::get('tasks', [\App\Http\Controllers\Api\Driver\Task\TaskController::class, 'index']);
        Route::patch('tasks/{task}/status', [\App\Http\Controllers\Api\Driver\Task\TaskController::class, 'updateStatus']);
        Route::patch('location', [\App\Http\Controllers\Api\Driver\Telemetry\TelemetryController::class, 'updateLocation']);

        // Shift Check-in / Check-out
        Route::get('vehicle/active', [\App\Http\Controllers\Api\Driver\Vehicle\ShiftController::class, 'activeVehicle']);
        Route::post('vehicle/check-in', [\App\Http\Controllers\Api\Driver\Vehicle\ShiftController::class, 'checkIn']);
        Route::post('vehicle/check-out', [\App\Http\Controllers\Api\Driver\Vehicle\ShiftController::class, 'checkOut']);

        // Notifications
        Route::get('notifications', [\App\Http\Controllers\Api\Driver\Notification\NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\Driver\Notification\NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [\App\Http\Controllers\Api\Driver\Notification\NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/all', [\App\Http\Controllers\Api\Driver\Notification\NotificationController::class, 'destroyAll']);
        Route::delete('notifications/{id}', [\App\Http\Controllers\Api\Driver\Notification\NotificationController::class, 'destroy']);

        // Profile & Settings
        Route::post('profile/picture', [\App\Http\Controllers\Api\Driver\Profile\ProfileController::class, 'updateProfilePicture']);
        Route::post('profile/email/request', [\App\Http\Controllers\Api\Driver\Profile\ProfileController::class, 'requestEmailChange']);
        Route::post('profile/email/confirm', [\App\Http\Controllers\Api\Driver\Profile\ProfileController::class, 'confirmEmailChange']);
        Route::post('profile/password', [\App\Http\Controllers\Api\Driver\Profile\ProfileController::class, 'changePassword']);
        Route::post('profile/push-subscription', [\App\Http\Controllers\Api\Driver\Profile\ProfileController::class, 'savePushSubscription']);
        Route::delete('profile/push-subscription', [\App\Http\Controllers\Api\Driver\Profile\ProfileController::class, 'deletePushSubscription']);
    });
});
