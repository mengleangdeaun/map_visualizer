<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_stops', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('route_id')->constrained('routes')->cascadeOnDelete();
            $table->foreignUlid('delivery_id')->constrained('deliveries')->cascadeOnDelete();

            $table->integer('sequence_number')->default(1)->comment('Optimized visit order within the route');
            $table->timestamp('eta')->nullable()->comment('OSRM-estimated arrival time at this stop');
            $table->timestamp('arrived_at')->nullable()->comment('Actual timestamp when driver arrived');
            $table->timestamp('completed_at')->nullable()->comment('Actual timestamp when stop was resolved');

            $table->enum('status', ['pending', 'in_transit', 'arrived', 'completed', 'skipped'])->default('pending');
            $table->text('notes')->nullable();

            // Leg-level OSRM data (from previous stop to this stop)
            $table->decimal('leg_distance_km', 7, 2)->nullable()->comment('Road distance from prior stop');
            $table->integer('leg_duration_min')->nullable()->comment('Driving minutes from prior stop');
            $table->json('leg_geometry')->nullable()->comment('GeoJSON LineString of the road path for this leg');

            $table->unique(['route_id', 'delivery_id']); // A delivery can only appear once per route
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_stops');
    }
};
