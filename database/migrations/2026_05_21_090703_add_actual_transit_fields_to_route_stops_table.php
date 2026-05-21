<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('route_stops', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->comment('Actual timestamp when transit was started');
            $table->geometry('actual_start_location', subtype: 'point')->nullable()->comment('PostGIS Point coordinates when start was clicked');
            $table->decimal('actual_leg_distance_km', 7, 2)->nullable()->comment('Actual road distance from the driver\'s start position');
            $table->integer('actual_leg_duration_min')->nullable()->comment('Actual expected road duration in minutes');
            $table->json('actual_leg_geometry')->nullable()->comment('GeoJSON overview road path geometry from actual start to destination');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('route_stops', function (Blueprint $table) {
            $table->dropColumn([
                'started_at',
                'actual_start_location',
                'actual_leg_distance_km',
                'actual_leg_duration_min',
                'actual_leg_geometry',
            ]);
        });
    }
};
