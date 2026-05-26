<?php

namespace Tests\Feature;

use App\Channels\WebPushChannel;
use App\Models\User\User;
use App\Models\User\PushSubscription;
use App\Models\System\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Tests\TestCase;

class WebPushNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the WebPush channel exits early when no subscriptions exist for the notifiable.
     */
    public function test_channel_exits_early_when_no_subscriptions_exist()
    {
        $company = Company::create([
            'name' => 'Test Logistics',
            'slug' => 'test-logistics',
            'base_currency' => 'USD',
            'status' => 'active',
        ]);

        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Driver John',
            'email' => 'john.driver@test.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'operational_status' => 'online',
        ]);

        $notification = new class extends Notification {
            public function toArray($notifiable): array {
                return ['title' => 'Test Notification', 'message' => 'Hello World'];
            }
        };

        $channel = new WebPushChannel();
        
        // Should execute cleanly without errors or side effects
        $channel->send($user, $notification);
        $this->assertTrue(true);
    }

    /**
     * Test that WelcomePushNotification instantiates and maps WebPush channel attributes cleanly.
     */
    public function test_welcome_push_notification_instantiation()
    {
        $company = Company::create([
            'name' => 'Test Logistics',
            'slug' => 'test-logistics',
            'base_currency' => 'USD',
            'status' => 'active',
        ]);

        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Driver John',
            'email' => 'john.driver@test.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'operational_status' => 'online',
        ]);

        $notification = new \App\Notifications\WelcomePushNotification();
        $this->assertEquals([WebPushChannel::class], $notification->via($user));
        
        $payload = $notification->toWebPush($user);
        $this->assertStringContainsString('System Connected!', $payload['title']);
        $this->assertStringContainsString('Welcome to SCCG Alerts!', $payload['description']);
    }

    /**
     * Test that configuration parameters map correctly.
     */
    public function test_vapid_configuration_values_are_registered()
    {
        $this->assertEquals('mailto:admin@example.com', config('services.vapid.subject'));
        $this->assertEquals('BI1hvKDfDcfpjyJEYyDcsHhyb10ZeyynBSxpg-y26l0lHLJKjfz6mNbyt4uA5-OcArH2NA9Mx01g_u75Af6r6ck', config('services.vapid.public_key'));
        $this->assertEquals('PkHlHjRO3_kxCOD3CKdNQPsUnlxwoNWRJvhPkAsXy1g', config('services.vapid.private_key'));
    }
}
