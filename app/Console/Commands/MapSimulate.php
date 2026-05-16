<?php

namespace App\Console\Commands;

use App\Events\VehicleLocationUpdated;
use Illuminate\Console\Command;

class MapSimulate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'map:simulate {--vehicle=} {--company=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simulate vehicle movement for UI testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting UI Simulation...");
        $this->info("Broadcasting to '.vehicle.location.updated' via Reverb...");
        
        $vehicleId = $this->option('vehicle') ?? "SIM-TEST-VEHICLE";
        $companyId = $this->option('company');

        // Starting point: Phnom Penh
        $lat = 11.5650;
        $lng = 104.9281;
        $heading = 0;

        while (true) {
            // Randomize movement a bit
            $heading = ($heading + rand(-15, 15)) % 360;
            $speed = rand(25, 55) + (rand(0, 9) / 10);
            
            // Calculate new position
            $distance = $speed * 0.00001; // Scale for 0.5s intervals
            $rad = deg2rad($heading);
            $lat += cos($rad) * $distance;
            $lng += sin($rad) * $distance;

            $this->info(sprintf(
                "SIMULATING [SIM-001]: %.6f, %.6f | Speed: %.1f km/h | Heading: %d°",
                $lat, $lng, $speed, $heading
            ));

            event(new VehicleLocationUpdated(
                $lat,
                $lng,
                $heading,
                $speed,
                $vehicleId,
                $companyId
            ));

            usleep(500000); // 0.5 second updates for smooth animation
        }
    }
}
