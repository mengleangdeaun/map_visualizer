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
        $databaseUrl = env('DATABASE_URL');
        if ($databaseUrl) {
            $parsed = parse_url($databaseUrl);
            if (isset($parsed['host'])) {
                config(['database.connections.pgsql.host' => $parsed['host']]);
            }
            if (isset($parsed['port'])) {
                config(['database.connections.pgsql.port' => $parsed['port']]);
            }
            if (isset($parsed['user'])) {
                config(['database.connections.pgsql.username' => urldecode($parsed['user'])]);
            }
            if (isset($parsed['pass'])) {
                config(['database.connections.pgsql.password' => urldecode($parsed['pass'])]);
            }
            if (isset($parsed['path'])) {
                config(['database.connections.pgsql.database' => ltrim($parsed['path'], '/')]);
            }

            // Clear url key so Laravel's DatabaseManager won't parse it and overwrite our custom settings
            config(['database.connections.pgsql.url' => null]);
        }

        $host = config('database.connections.pgsql.host');
        if ($host && str_contains($host, 'pg.laravel.cloud')) {
            $hostParts = explode('.', $host);
            $endpointId = $hostParts[0];

            config([
                'database.connections.pgsql.sslmode' => 'require',
            ]);

            $username = config('database.connections.pgsql.username');
            if ($username && ! str_contains($username, '$') && ! str_contains($username, ';')) {
                config([
                    'database.connections.pgsql.username' => $endpointId.';'.$username,
                ]);
            }
        }

        // DEBUG: Inspect connection state and env at boot time
        throw new \Exception(
            "DEBUG_DEPLOY_BOOTSTRAP | " .
            "DATABASE_URL_SET: " . ($databaseUrl ? 'YES' : 'NO') . " | " .
            "DB_HOST: " . config('database.connections.pgsql.host') . " | " .
            "DB_USERNAME: " . config('database.connections.pgsql.username') . " | " .
            "DB_DATABASE: " . config('database.connections.pgsql.database') . " | " .
            "DB_SSLMODE: " . config('database.connections.pgsql.sslmode')
        );
    }
}
