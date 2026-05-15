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
    });
});
