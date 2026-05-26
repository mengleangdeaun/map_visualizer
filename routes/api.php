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
Route::post('/forgot-password', [\App\Http\Controllers\Api\Auth\AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [\App\Http\Controllers\Api\Auth\AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [\App\Http\Controllers\Api\Auth\AuthController::class, 'me']);
    Route::post('/logout', [\App\Http\Controllers\Api\Auth\AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // System Domain (Super Admin)
    Route::prefix('system')->name('system.')->group(function () {
        Route::apiResource('companies', \App\Http\Controllers\Api\System\Company\CompanyController::class);
        Route::apiResource('users', \App\Http\Controllers\Api\System\User\UserController::class);
        Route::apiResource('exchange-rates', \App\Http\Controllers\Api\System\ExchangeRate\ExchangeRateController::class);
        
        Route::get('companies/{company}/telegram-settings', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'show']);
        Route::put('companies/{company}/telegram-settings', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'update']);
        Route::post('companies/{company}/telegram-settings/test-bot', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'testBot']);
        Route::post('companies/{company}/telegram-settings/test-message', [\App\Http\Controllers\Api\System\TelegramSettingController::class, 'testMessage']);

        Route::get('settings', [\App\Http\Controllers\Api\System\SystemSettingController::class, 'index']);
        Route::put('settings', [\App\Http\Controllers\Api\System\SystemSettingController::class, 'update']);
        Route::post('settings/sync', [\App\Http\Controllers\Api\System\SystemSettingController::class, 'sync']);
    });

    // Fleet Domain
    Route::prefix('fleet')->name('fleet.')->group(function () {
        Route::apiResource('locations', \App\Http\Controllers\Api\Fleet\Location\LocationController::class);
    });

    // Admin Domain (Company Admin / Dispatcher)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::prefix('fleet')->name('fleet.')->group(function () {
            Route::apiResource('users', \App\Http\Controllers\Api\Admin\Fleet\UserController::class);
            Route::apiResource('vehicles', \App\Http\Controllers\Api\Admin\Fleet\VehicleController::class);
            Route::apiResource('tasks', \App\Http\Controllers\Api\Admin\Fleet\TaskController::class);
            Route::apiResource('customers', \App\Http\Controllers\Api\Admin\Customer\CustomerController::class);
            Route::apiResource('deliveries', \App\Http\Controllers\Api\Admin\Delivery\DeliveryController::class);
            Route::post('document-number-settings/{id}/generate', [\App\Http\Controllers\Api\Admin\Fleet\DocumentNumberSettingController::class, 'generate']);
            Route::apiResource('document-number-settings', \App\Http\Controllers\Api\Admin\Fleet\DocumentNumberSettingController::class);
            Route::patch('vehicles/active/location', [\App\Http\Controllers\Api\Admin\Fleet\VehicleController::class, 'updateActiveLocation']);
            Route::patch('vehicles/{vehicle}/location', [\App\Http\Controllers\Api\Admin\Fleet\VehicleController::class, 'updateLocation']);

            // Route management
            Route::apiResource('routes', \App\Http\Controllers\Api\Admin\Delivery\RouteController::class);
            Route::post('routes/{route}/stops', [\App\Http\Controllers\Api\Admin\Delivery\RouteController::class, 'addStops']);
            Route::delete('routes/{route}/stops/{stop}', [\App\Http\Controllers\Api\Admin\Delivery\RouteController::class, 'removeStop']);
            Route::put('routes/{route}/reorder', [\App\Http\Controllers\Api\Admin\Delivery\RouteController::class, 'reorder']);
            Route::post('routes/{route}/optimize', [\App\Http\Controllers\Api\Admin\Delivery\RouteController::class, 'optimize']);
        });

        // Geospatial road alerts
        Route::post('road-alerts', [\App\Http\Controllers\Api\Admin\Delivery\RoadAlertController::class, 'store']);
        Route::get('road-alerts', [\App\Http\Controllers\Api\Admin\Delivery\RoadAlertController::class, 'index']);
        Route::delete('road-alerts/{id}', [\App\Http\Controllers\Api\Admin\Delivery\RoadAlertController::class, 'destroy']);

        // Company Telegram Event Rules Configurator
        Route::get('company/telegram-rules', [\App\Http\Controllers\Api\Admin\CompanyTelegramRulesController::class, 'show']);
        Route::put('company/telegram-rules', [\App\Http\Controllers\Api\Admin\CompanyTelegramRulesController::class, 'update']);
        Route::post('company/telegram-rules/test-action', [\App\Http\Controllers\Api\Admin\CompanyTelegramRulesController::class, 'testAction']);
    });

    // Driver Domain
    Route::prefix('driver')->name('driver.')->group(function () {
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

        // Multi-Stop Delivery Routes
        Route::prefix('route')->group(function () {
            Route::get('active', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'getActiveRoute']);
            Route::get('history', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'getRouteHistory']);
            Route::post('stops/{id}/start', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'start']);
            Route::post('stops/{id}/arrive', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'arrive']);
            Route::post('stops/{id}/complete', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'complete']);
            Route::post('stops/{id}/fail', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'fail']);
        });

        // Active Road alerts for Driver Map
        Route::get('road-alerts', [\App\Http\Controllers\Api\Driver\Delivery\RouteController::class, 'getRoadAlerts']);
        Route::post('road-alerts', [\App\Http\Controllers\Api\Admin\Delivery\RoadAlertController::class, 'store']);
    });
});
