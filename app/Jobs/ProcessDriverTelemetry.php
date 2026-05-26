<?php
 
namespace App\Jobs;

use App\Models\Driver\DriverTelemetry;
use App\Models\Fleet\Vehicle;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProcessDriverTelemetry implements ShouldQueue
{
    use Queueable;

    protected string $driverId;
    protected array $telemetryData;

    /**
     * Create a new job instance.
     */
    public function __construct(string $driverId, array $telemetryData)
    {
        $this->driverId = $driverId;
        $this->telemetryData = $telemetryData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Find the vehicle assigned to this driver
        $vehicle = Vehicle::where('driver_id', $this->driverId)->first();

        $speed = $this->telemetryData['speed'] ?? null;
        $heading = $this->telemetryData['heading'] ?? null;
        $lat = (float) $this->telemetryData['latitude'];
        $lng = (float) $this->telemetryData['longitude'];
        $recordedAt = isset($this->telemetryData['recorded_at'])
            ? Carbon::parse($this->telemetryData['recorded_at'])
            : now();

        // Create telemetry record
        $telemetry = new DriverTelemetry();
        $telemetry->driver_id = $this->driverId;
        $telemetry->vehicle_id = $vehicle?->id;
        $telemetry->speed_kmh = $speed ? round($speed * 3.6) : 0;
        $telemetry->heading = $heading !== null ? round($heading) : null;
        $telemetry->recorded_at = $recordedAt;
        $telemetry->save();

        // Update spatial location using raw SQL for SRID 4326
        DB::statement("UPDATE driver_telemetry SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?", [
            $lng,
            $lat,
            $telemetry->id
        ]);

        // Update the vehicle's current position if assigned
        if ($vehicle) {
            $vehicle->update([
                'last_location' => DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)"),
                'is_active' => true,
                'last_telemetry_at' => $recordedAt,
            ]);
        }
    }
}
