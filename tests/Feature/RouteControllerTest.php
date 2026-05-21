<?php

namespace Tests\Feature;

use App\Models\Customer\Customer;
use App\Models\Delivery\Delivery;
use App\Models\Delivery\Order;
use App\Models\Delivery\Route;
use App\Models\Delivery\RouteStop;
use App\Models\Fleet\Location;
use App\Models\System\Company;
use App\Models\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RouteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Company $company;
    protected User $driver;
    protected Location $hub;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a Company
        $this->company = Company::create([
            'name' => 'Test Logistics',
            'slug' => 'test-logistics',
            'base_currency' => 'USD',
            'status' => 'active',
        ]);

        // 2. Create a Hub Location
        $this->hub = Location::create([
            'company_id' => $this->company->id,
            'code' => 'HUB-01',
            'name' => 'Central Hub',
            'type' => 'hub',
            'location' => DB::raw("ST_GeomFromText('POINT(104.883628 11.564134)', 4326)"),
        ]);

        // 3. Create a Driver User
        $this->driver = User::create([
            'company_id' => $this->company->id,
            'name' => 'Driver John',
            'email' => 'john.driver@test.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'base_hub_id' => $this->hub->id,
            'status' => 'active',
            'operational_status' => 'online',
        ]);

        // 4. Create a Customer
        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'name' => 'Jane Smith',
            'phone' => '+85512345678',
            'default_address' => 'Phnom Penh, Cambodia',
        ]);
    }

    /**
     * Helper to create a delivery and route stop.
     */
    protected function createRouteWithStop(string $stopStatus = 'pending', string $routeStatus = 'pending'): array
    {
        // Create an Order
        $order = Order::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'ORD-' . uniqid(),
            'status' => 'pending',
            'currency_code' => 'USD',
            'exchange_rate' => 1.0,
            'grand_total' => 150.00,
            'amount_due_cod' => 150.00,
            'payment_method' => 'cash',
        ]);

        // Create a Route
        $route = Route::create([
            'company_id' => $this->company->id,
            'driver_id' => $this->driver->id,
            'hub_id' => $this->hub->id,
            'date' => now()->toDateString(),
            'status' => 'in_progress',
            'stop_count' => 1,
        ]);

        // Create a Delivery
        $delivery = Delivery::create([
            'company_id' => $this->company->id,
            'order_id' => $order->id,
            'tracking_number' => 'TRK-' . uniqid(),
            'weight_kg' => 2.5,
            'dropoff_address' => 'Phnom Penh, Cambodia',
            'dropoff_location' => DB::raw("ST_GeomFromText('POINT(104.883628 11.564134)', 4326)"),
            'status' => 'pending',
            'driver_id' => $this->driver->id,
            'route_status' => $routeStatus,
        ]);

        // Create a RouteStop
        $routeStop = RouteStop::create([
            'route_id' => $route->id,
            'delivery_id' => $delivery->id,
            'sequence_number' => 1,
            'status' => $stopStatus,
        ]);

        return [
            'order' => $order,
            'route' => $route,
            'delivery' => $delivery,
            'routeStop' => $routeStop,
        ];
    }

    /**
     * Test get active route.
     */
    public function test_get_active_route_returns_assigned_route_with_transit_status(): void
    {
        $data = $this->createRouteWithStop('in_transit', 'pending');

        $response = $this->actingAs($this->driver, 'sanctum')
            ->getJson('/api/driver/route/active');

        $response->assertStatus(200)
            ->assertJsonPath('data.stops.0.status', 'in_transit')
            ->assertJsonPath('data.stops.0.delivery.tracking_number', $data['delivery']->tracking_number);
    }

    /**
     * Test start delivery endpoint.
     */
    public function test_start_delivery_route_updates_status_and_timestamps(): void
    {
        $data = $this->createRouteWithStop('pending', 'pending');
        $delivery = $data['delivery'];

        $this->assertNull($delivery->started_at);

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery->id}/start");

        $response->assertStatus(200)
            ->assertJsonPath('data.stop_status', 'in_transit')
            ->assertJsonPath('data.delivery_status', 'out_for_delivery');

        // Check database state
        $delivery->refresh();
        $this->assertEquals('out_for_delivery', $delivery->status);
        $this->assertNotNull($delivery->started_at);

        $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
        $this->assertEquals('in_transit', $routeStop->status);
    }

    /**
     * Test arrive at stop endpoint.
     */
    public function test_arrive_at_stop_updates_status_and_timestamps(): void
    {
        $data = $this->createRouteWithStop('in_transit', 'pending');
        $delivery = $data['delivery'];

        // Preset started_at to ensure it is not overwritten if already set
        $presetStartedAt = now()->subMinutes(10);
        $delivery->started_at = $presetStartedAt;
        $delivery->save();

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery->id}/arrive");

        $response->assertStatus(200)
            ->assertJsonPath('data.stop_status', 'arrived');

        // Check database state
        $delivery->refresh();
        $this->assertEquals('arrived', $delivery->route_status);
        $this->assertEquals('out_for_delivery', $delivery->status);
        // started_at should remain the preset time (preserved)
        $this->assertEquals($presetStartedAt->toDateTimeString(), $delivery->started_at->toDateTimeString());

        $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
        $this->assertEquals('arrived', $routeStop->status);
        $this->assertNotNull($routeStop->arrived_at);
    }

    /**
     * Test complete stop endpoint.
     */
    public function test_complete_stop_resolves_as_delivered_and_updates_order(): void
    {
        $data = $this->createRouteWithStop('arrived', 'arrived');
        $delivery = $data['delivery'];
        $order = $data['order'];

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery->id}/complete");

        $response->assertStatus(200)
            ->assertJsonPath('data.stop_status', 'completed')
            ->assertJsonPath('data.delivery_status', 'delivered');

        // Check database state
        $delivery->refresh();
        $this->assertEquals('completed', $delivery->route_status);
        $this->assertEquals('delivered', $delivery->status);
        $this->assertNotNull($delivery->completed_at);

        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals(150.00, $order->paid_amount);
        $this->assertEquals(0, $order->balance_amount);

        $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
        $this->assertEquals('completed', $routeStop->status);
        $this->assertNotNull($routeStop->completed_at);

        // Check ProofOfDelivery
        $pod = \App\Models\Delivery\ProofOfDelivery::where('delivery_id', $delivery->id)->first();
        $this->assertNotNull($pod);
        $this->assertEquals($this->customer->name, $pod->receiver_name);
        $this->assertEquals($this->driver->id, $pod->driver_id);
        $this->assertEquals($this->driver->id, $pod->created_by);
        $this->assertEquals($this->driver->id, $pod->updated_by);

        // Check Route completed automatically
        $route = $data['route'];
        $route->refresh();
        $this->assertEquals('completed', $route->status);
    }

    /**
     * Test complete stop with coordinates.
     */
    public function test_complete_stop_with_coordinates_captures_location(): void
    {
        $data = $this->createRouteWithStop('arrived', 'arrived');
        $delivery = $data['delivery'];

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery->id}/complete", [
                'latitude' => 11.564134,
                'longitude' => 104.883628,
                'notes' => 'Left at front door',
            ]);

        $response->assertStatus(200);

        $pod = \App\Models\Delivery\ProofOfDelivery::where('delivery_id', $delivery->id)->first();
        $this->assertNotNull($pod);
        $this->assertEquals('Left at front door', $pod->notes);
        $this->assertEquals($this->customer->name, $pod->receiver_name);
        $this->assertEquals($this->driver->id, $pod->driver_id);
        $this->assertEquals($this->driver->id, $pod->created_by);
        $this->assertEquals($this->driver->id, $pod->updated_by);

        // Fetch location as raw text from PostGIS
        $loc = DB::selectOne("SELECT ST_AsText(captured_location) as geom FROM proof_of_deliveries WHERE id = ?", [$pod->id]);
        $this->assertEquals('POINT(104.883628 11.564134)', $loc->geom);
    }

    /**
     * Test fail stop endpoint.
     */
    public function test_fail_stop_records_skipped_status_and_logs_issue(): void
    {
        $data = $this->createRouteWithStop('arrived', 'arrived');
        $delivery = $data['delivery'];

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery->id}/fail", [
                'reason_code' => 'customer_unreachable',
                'notes' => 'Called 3 times, no answer.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.stop_status', 'skipped')
            ->assertJsonPath('data.delivery_status', 'failed');

        // Check database state
        $delivery->refresh();
        $this->assertEquals('skipped', $delivery->route_status);
        $this->assertEquals('failed', $delivery->status);
        $this->assertNotNull($delivery->completed_at);

        $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
        $this->assertEquals('skipped', $routeStop->status);
        $this->assertNotNull($routeStop->completed_at);

        // Check issue logged
        $issue = DB::table('delivery_issues')->where('delivery_id', $delivery->id)->first();
        $this->assertNotNull($issue);
        $this->assertEquals('customer_unreachable', $issue->issue_type);
        $this->assertEquals('Called 3 times, no answer.', $issue->description);

        // Check Route completed automatically
        $route = $data['route'];
        $route->refresh();
        $this->assertEquals('completed', $route->status);
    }

    /**
     * Test Route transitions to completed only when all stops are resolved.
     */
    public function test_route_transitions_to_completed_only_when_all_stops_are_resolved(): void
    {
        // Create an Order
        $order1 = Order::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'ORD-' . uniqid(),
            'status' => 'pending',
            'currency_code' => 'USD',
            'exchange_rate' => 1.0,
            'grand_total' => 100.00,
            'amount_due_cod' => 100.00,
            'payment_method' => 'cash',
        ]);

        $order2 = Order::create([
            'company_id' => $this->company->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'ORD-' . uniqid(),
            'status' => 'pending',
            'currency_code' => 'USD',
            'exchange_rate' => 1.0,
            'grand_total' => 50.00,
            'amount_due_cod' => 50.00,
            'payment_method' => 'cash',
        ]);

        // Create a Route
        $route = Route::create([
            'company_id' => $this->company->id,
            'driver_id' => $this->driver->id,
            'hub_id' => $this->hub->id,
            'date' => now()->toDateString(),
            'status' => 'in_progress',
            'stop_count' => 2,
        ]);

        // Create two Deliveries
        $delivery1 = Delivery::create([
            'company_id' => $this->company->id,
            'order_id' => $order1->id,
            'tracking_number' => 'TRK-' . uniqid(),
            'weight_kg' => 1.5,
            'dropoff_address' => 'Phnom Penh, Cambodia',
            'dropoff_location' => DB::raw("ST_GeomFromText('POINT(104.883628 11.564134)', 4326)"),
            'status' => 'pending',
            'driver_id' => $this->driver->id,
            'route_status' => 'arrived',
        ]);

        $delivery2 = Delivery::create([
            'company_id' => $this->company->id,
            'order_id' => $order2->id,
            'tracking_number' => 'TRK-' . uniqid(),
            'weight_kg' => 2.0,
            'dropoff_address' => 'Phnom Penh, Cambodia',
            'dropoff_location' => DB::raw("ST_GeomFromText('POINT(104.883628 11.564134)', 4326)"),
            'status' => 'pending',
            'driver_id' => $this->driver->id,
            'route_status' => 'arrived',
        ]);

        // Create two RouteStops
        $stop1 = RouteStop::create([
            'route_id' => $route->id,
            'delivery_id' => $delivery1->id,
            'sequence_number' => 1,
            'status' => 'arrived',
        ]);

        $stop2 = RouteStop::create([
            'route_id' => $route->id,
            'delivery_id' => $delivery2->id,
            'sequence_number' => 2,
            'status' => 'arrived',
        ]);

        // Complete first stop
        $response1 = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery1->id}/complete");

        $response1->assertStatus(200);

        // Assert route is still in_progress
        $route->refresh();
        $this->assertEquals('in_progress', $route->status);

        // Fail second stop (which resolves it as skipped)
        $response2 = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery2->id}/fail", [
                'reason_code' => 'refused_delivery',
                'notes' => 'Customer refused',
            ]);

        $response2->assertStatus(200);

        // Assert route is now completed
        $route->refresh();
        $this->assertEquals('completed', $route->status);
    }

    /**
     * Test start delivery stop with actual location and OSRM enrichment.
     */
    public function test_start_stop_captures_driver_actual_location_and_calls_osrm(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'http://127.0.0.1:5000/*' => \Illuminate\Support\Facades\Http::response([
                'routes' => [
                    [
                        'distance' => 5500.0, // 5.5 km
                        'duration' => 900.0, // 15 mins
                        'geometry' => [
                            'type' => 'LineString',
                            'coordinates' => [
                                [104.883628, 11.564134],
                                [104.890000, 11.570000]
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        $data = $this->createRouteWithStop('pending', 'pending');
        $delivery = $data['delivery'];

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/driver/route/stops/{$delivery->id}/start", [
                'latitude' => 11.564134,
                'longitude' => 104.883628,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.stop_status', 'in_transit')
            ->assertJsonPath('data.delivery_status', 'out_for_delivery')
            ->assertJsonPath('data.actual_leg_distance_km', 5.5)
            ->assertJsonPath('data.actual_leg_duration_min', 15)
            ->assertJsonPath('data.actual_leg_geometry.type', 'LineString');

        // Check database state of RouteStop
        $routeStop = RouteStop::where('delivery_id', $delivery->id)->first();
        $this->assertEquals('in_transit', $routeStop->status);
        $this->assertEquals(5.5, (float)$routeStop->actual_leg_distance_km);
        $this->assertEquals(15, $routeStop->actual_leg_duration_min);
        $this->assertEquals('LineString', $routeStop->actual_leg_geometry['type']);

        // Check captured starting location
        $loc = DB::selectOne("SELECT ST_AsText(actual_start_location) as geom FROM route_stops WHERE delivery_id = ?", [$delivery->id]);
        $this->assertEquals('POINT(104.883628 11.564134)', $loc->geom);
    }
}
