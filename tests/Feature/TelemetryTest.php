<?php

namespace Tests\Feature;

use App\Models\Fleet\Location;
use App\Models\Fleet\Vehicle;
use App\Models\System\Company;
use App\Models\User\User;
use App\Jobs\ProcessDriverTelemetry;
use App\Models\Driver\DriverTelemetry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class TelemetryTest extends TestCase
{
    use RefreshDatabase;

    protected Company $company;
    protected User $driver;
    protected Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a Company
        $this->company = Company::create([
            'name' => 'Logistics Inc',
            'slug' => 'logistics-inc',
            'base_currency' => 'USD',
            'status' => 'active',
        ]);

        // 2. Create a Driver User
        $this->driver = User::create([
            'company_id' => $this->company->id,
            'name' => 'Driver Bob',
            'email' => 'bob.driver@test.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'operational_status' => 'online',
        ]);

        // 3. Create a Vehicle and assign it to the driver
        $this->vehicle = Vehicle::create([
            'company_id' => $this->company->id,
            'driver_id' => $this->driver->id,
            'type' => 'van',
            'plate_number' => 'PP-1234',
            'max_weight_kg' => 1500,
            'max_volume_cbm' => 10,
            'is_active' => false,
        ]);
    }

    /**
     * Test location update caches hot data and dispatches background job.
     */
    public function test_location_update_caches_telemetry_and_dispatches_job(): void
    {
        Queue::fake();
        Cache::flush();

        $payload = [
            'latitude' => 11.564134,
            'longitude' => 104.883628,
            'speed' => 15.5, // ~56 km/h
            'heading' => 180.0, // South
        ];

        $response = $this->actingAs($this->driver, 'sanctum')
            ->patchJson('/api/driver/location', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Location updated successfully')
            ->assertJsonPath('vehicle_id', $this->vehicle->id);

        // Assert data is stored in the hot cache
        $cachedDriver = Cache::get("driver:telemetry:{$this->driver->id}");
        $this->assertNotNull($cachedDriver);
        $this->assertEquals(11.564134, $cachedDriver['latitude']);
        $this->assertEquals(104.883628, $cachedDriver['longitude']);
        $this->assertEquals(15.5, $cachedDriver['speed']);
        $this->assertEquals(180.0, $cachedDriver['heading']);

        $cachedVehicle = Cache::get("vehicle:telemetry:{$this->vehicle->id}");
        $this->assertNotNull($cachedVehicle);
        $this->assertEquals($this->vehicle->id, $cachedVehicle['vehicle_id']);

        // Assert process job was dispatched to background queue
        Queue::assertPushed(ProcessDriverTelemetry::class, function ($job) use ($payload) {
            return true;
        });
    }

    /**
     * Test background job execution correctly updates the database with PostGIS geometry.
     */
    public function test_telemetry_job_correctly_persists_to_database(): void
    {
        $payload = [
            'latitude' => 11.564134,
            'longitude' => 104.883628,
            'speed' => 15.5,
            'heading' => 180.0,
        ];

        // Execute the job synchronously
        $job = new ProcessDriverTelemetry($this->driver->id, $payload);
        $job->handle();

        // Verify the database telemetry record was created
        $telemetry = DriverTelemetry::where('driver_id', $this->driver->id)->first();
        $this->assertNotNull($telemetry);
        $this->assertEquals($this->vehicle->id, $telemetry->vehicle_id);
        $this->assertEquals(56, $telemetry->speed_kmh); // round(15.5 * 3.6) = 56
        $this->assertEquals(180, $telemetry->heading);

        // Fetch location as raw text from PostGIS
        $loc = DB::selectOne("SELECT ST_AsText(location) as geom FROM driver_telemetry WHERE id = ?", [$telemetry->id]);
        $this->assertEquals('POINT(104.883628 11.564134)', $loc->geom);

        // Verify the vehicle was updated
        $this->vehicle->refresh();
        $this->assertTrue($this->vehicle->is_active);
        $this->assertNotNull($this->vehicle->last_telemetry_at);

        $vehLoc = DB::selectOne("SELECT ST_AsText(last_location) as geom FROM vehicles WHERE id = ?", [$this->vehicle->id]);
        $this->assertEquals('POINT(104.883628 11.564134)', $vehLoc->geom);
    }

    /**
     * Test VehicleService findById and list methods integrate Valkey cache.
     */
    public function test_vehicle_service_utilizes_cache(): void
    {
        Cache::flush();

        // 1. Initially retrieve vehicle with no cache, should fallback to Postgres defaults
        $service = new \App\Services\Admin\Fleet\VehicleService();
        $vehicle = $service->findById($this->vehicle->id);
        $this->assertNull($vehicle->latitude);
        $this->assertNull($vehicle->longitude);
        $this->assertEquals(0, $vehicle->heading);

        // 2. Put simulated telemetry into Valkey Cache
        $telemetryData = [
            'latitude' => 11.99999,
            'longitude' => 104.99999,
            'speed' => 10.0,
            'heading' => 270.0, // West
            'vehicle_id' => $this->vehicle->id,
            'recorded_at' => now()->toIso8601String(),
        ];
        Cache::put("vehicle:telemetry:{$this->vehicle->id}", $telemetryData, now()->addMinutes(30));

        // 3. Retrieve vehicle again and assert it merges Valkey data
        $vehicleCached = $service->findById($this->vehicle->id);
        $this->assertEquals(11.99999, $vehicleCached->latitude);
        $this->assertEquals(104.99999, $vehicleCached->longitude);
        $this->assertEquals(270, $vehicleCached->heading);

        // 4. Retrieve list of vehicles and assert it is cached
        $list = $service->list([]);
        $listedVehicle = collect($list->items())->firstWhere('id', $this->vehicle->id);
        $this->assertNotNull($listedVehicle);
        $this->assertEquals(11.99999, $listedVehicle->latitude);
        $this->assertEquals(104.99999, $listedVehicle->longitude);
        $this->assertEquals(270, $listedVehicle->heading);
    }
}
