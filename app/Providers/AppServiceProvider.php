<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $host = config('database.connections.pgsql.host');
        if ($host && str_contains($host, 'pg.laravel.cloud')) {
            $hostParts = explode('.', $host);
            $endpointId = $hostParts[0];

            config([
                'database.connections.pgsql.sslmode' => 'require',
            ]);

            $username = config('database.connections.pgsql.username');
            if ($username && !str_contains($username, '$') && !str_contains($username, ';')) {
                config([
                    'database.connections.pgsql.username' => $endpointId . ';' . $username,
                ]);
            }
        }
    }
}
