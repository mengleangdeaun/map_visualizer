<?php

namespace App\Console\Commands;

use App\Events\VehicleLocationUpdated;
use GuzzleHttp\Client as HttpClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use WebSocket\Client as WebSocketClient;

class DamoovBridge extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'damoov:bridge {--token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2Q1MmI4Ny1kNzA3LTRhZTQtYWZmNy00OGQ4N2JjOGFkNzgiLCJqdGkiOiI1NWJiMTE1Mi1mOTNlLTQ3MWEtOWUwOS0xNDgzMmQ3Mzk5NDciLCJpYXQiOjE3NzgzMDg5NTgsIlNka0VuYWJsZUxvZ2dpbmciOiJGYWxzZSIsIlNka0VuYWJsZVRyYWNraW5nIjoiVHJ1ZSIsIlNka0NsaWVudElkIjoiIiwiU2RrRW5hYmxlZCI6IlRydWUiLCJTZGtTZXR0aW5nc1VyaSI6Imh0dHBzOi8vYXBpLnRlbGVtYXRpY3NzZGsuY29tL3NldHRpbmdzL2Jhc2UiLCJJbnN0YW5jZUlkIjoiNzJkMDNhZDE1NTg2NDgwMDk3YWJhYWU2YmMwMWNkOGMiLCJEZXZpY2VUb2tlbiI6IjQzZDUyYjg3ZDcwNzRhZTRhZmY3NDhkODdiYzhhZDc4IiwiQ29tcGFueUlkIjoiYzE5MDRjYjBhZTI2NDNmZDg2YWNlZDUzOGRiMGU0ZjMiLCJBcHBJZCI6IjFkN2ZjMDg3ODAzNzQ1MGM5NTA3ZGExMDc4ODg1MTUzIiwiSXNBZG1pbiI6IkZhbHNlIiwiU2RrIjoiVHJ1ZSIsIm5iZiI6MTc3ODMwODk1NywiZXhwIjoxNzc5MTcyOTU3LCJpc3MiOiJ3ZWJBcGkiLCJhdWQiOiJodHRwczovL3VzZXIudGVsZW1hdGljc3Nkay5jb20ifQ.fAVfSjRHV80GAJa15xO1MLPjTx2Z48A47xMgrzOrs-BnWk6CHCnO5gVfeVzqMmd8alNIz5KMYjip7hLUwC3yHzveeXYoCI8hxEA5eMMQ6HsONEk5Yyk0iko9bg73y-C0N6zXTWFpviAZO7eaBx2PRoNhzlbDia1eNLzPt0qNQYxD3J6oXmEnPA02hHkiuWsid_swYxSrMBt-XbLfE7tLUwMvbEq9SxUfEGi99MdPYm9OfK_oLTvEgi3wDLjxFYcaeCohOmBJYe-Ak8QvBsPA3Xe-mGpxJ4iwaJRMGDVp4SAWTGeDJX5eRpfqKa8zL3eciam8tpofgEmdMmJZdB7DEw}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Connect to Damoov WebSocket and broadcast vehicle location updates';

    private $jwt;
    private $instanceId;
    private $instanceKey;
    private $deviceToken;
    private $retryCount = 0;
    private $maxRetries = 10;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->instanceId = config('services.damoov.instance_id');
        $this->instanceKey = config('services.damoov.instance_key');
        $this->deviceToken = config('services.damoov.device_token');

        if (!$this->instanceId || !$this->instanceKey) {
            $this->error('DAMOOV_INSTANCE_ID or DAMOOV_INSTANCE_KEY missing in .env');
            return 1;
        }

        // Handle manual token injection
        if ($this->option('token')) {
            $this->jwt = $this->option('token');
            $cacheKey = 'damoov_jwt_' . md5($this->instanceId . $this->deviceToken);
            Cache::put($cacheKey, $this->jwt, now()->addHours(120));
            $this->info('Manual token accepted and cached for 120 hours.');
        }

        $this->info('Starting Damoov Bridge...');
        
        if (!$this->jwt) {
            while ($this->retryCount < $this->maxRetries) {
                $this->authenticate();

                if ($this->jwt) {
                    break;
                }

                $this->retryCount++;
                $sleepTime = min(pow(2, $this->retryCount), 60); // Exponential backoff up to 60s
                $this->warn("Authentication failed. Retrying in {$sleepTime} seconds... ({$this->retryCount}/{$this->maxRetries})");
                sleep($sleepTime);
            }
        }

        if (!$this->jwt) {
            $this->error('Failed to obtain JWT token after multiple retries.');
            return 1;
        }

        $this->connectToWebSocket();
    }

    private function authenticate($force = false)
    {
        $cacheKey = 'damoov_jwt_' . md5($this->instanceId . $this->deviceToken);
        
        if (!$force) {
            $this->jwt = Cache::get($cacheKey);
            if ($this->jwt) {
                $this->info('Using cached JWT token.');
                return;
            }
        } else {
            Cache::forget($cacheKey);
            $this->info('Forcing re-authentication...');
        }

        $this->info('Authenticating with Damoov...');
        $client = new HttpClient();
        
        try {
            $response = $client->post('https://user.telematicssdk.com/v1/Auth/Login', [
                'json' => [
                    'LoginFields' => json_encode(['Devicetoken' => $this->deviceToken]),
                    'Password' => $this->instanceKey,
                ],
                'headers' => [
                    'InstanceId' => $this->instanceId,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            
            if (isset($data['Result']['AccessToken']['Token'])) {
                $this->jwt = $data['Result']['AccessToken']['Token'];
            } elseif (isset($data['Data']['AccessToken']['Token'])) {
                $this->jwt = $data['Data']['AccessToken']['Token'];
            } elseif (isset($data['Data']['Token'])) {
                $this->jwt = $data['Data']['Token'];
            } elseif (isset($data['Token'])) {
                $this->jwt = $data['Token'];
            }

            if ($this->jwt && is_string($this->jwt)) {
                $this->info('Authenticated successfully!');
                $this->line('<fg=cyan>TOKEN:</> ' . $this->jwt);
                // Cache the token for 120 hours (Damoov token lifecycle)
                Cache::put($cacheKey, $this->jwt, now()->addHours(120));
                $this->retryCount = 0; // Reset retry count on success
            } else {
                $this->error('Token not found or not a string.');
                $this->line(json_encode($data, JSON_PRETTY_PRINT));
            }
        } catch (\Exception $e) {
            $this->error('Authentication failed: ' . $e->getMessage());
        }
    }

    private function connectToWebSocket()
    {
        // Using portal-apis.telematicssdk.com as indicated in Damoov documentation
        $url = "wss://portal-apis.telematicssdk.com/ws?token=" . $this->jwt;
        
        $this->info("Connecting to WebSocket...");
        
        try {
            $client = new WebSocketClient($url);
            $this->info("Connected.");
            
            while (true) {
                try {
                    $message = $client->receive();
                    if ($message) {
                        $this->processMessage($message);
                    }
                } catch (\WebSocket\ConnectionException $e) {
                    $this->error("WebSocket connection lost: " . $e->getMessage());
                    $this->info("Re-authenticating and reconnecting...");
                    $this->authenticate(true);
                    if ($this->jwt) {
                        $client = new WebSocketClient("wss://portal-apis.telematicssdk.com/ws?token=" . $this->jwt);
                    } else {
                        sleep(5);
                    }
                } catch (\Exception $e) {
                    $this->error("WebSocket error: " . $e->getMessage());
                    sleep(1);
                }
            }
        } catch (\Exception $e) {
            $this->error("Could not connect to WebSocket: " . $e->getMessage());
        }
    }

    private function processMessage($message)
    {
        $data = json_decode($message, true);
        
        if (!$data) return;

        // Damoov telemetry payloads often use abbreviated keys
        $payload = $data['payload'] ?? $data['Data'] ?? $data;
        
        $lat = $payload['lat'] ?? $payload['La'] ?? $payload['latitude'] ?? null;
        $lng = $payload['lng'] ?? $payload['Lo'] ?? $payload['longitude'] ?? null;
        
        if ($lat !== null && $lng !== null) {
            $deviceToken = $payload['deviceToken'] ?? $payload['deviceId'] ?? $payload['Dt'] ?? 'unknown';

            // Filter by device token if configured in .env
            if ($this->deviceToken && $deviceToken !== $this->deviceToken) {
                return;
            }

            $heading = (float)($payload['heading'] ?? $payload['He'] ?? $payload['H'] ?? 0);
            $speed = (float)($payload['speed'] ?? $payload['Sp'] ?? $payload['S'] ?? 0);

            $this->info("Update [{$deviceToken}]: {$lat}, {$lng} | Speed: {$speed} | Heading: {$heading}°");

            event(new VehicleLocationUpdated(
                (float)$lat,
                (float)$lng,
                $heading,
                $speed,
                $deviceToken
            ));
        }
    }
}
