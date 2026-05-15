<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->string('code')->nullable(); // e.g., 'HUB-PNH-01'
            $table->string('name');
            $table->string('type'); // main_sort, regional_hub, local_node
            
            $table->timestamps();
        });

        // PostGIS spatial columns via raw SQL for better SRID control
        DB::statement('ALTER TABLE locations ADD location GEOMETRY(POINT, 4326) NULL');
        DB::statement('ALTER TABLE locations ADD geofence GEOMETRY(POLYGON, 4326) NULL');
        
        DB::statement('CREATE INDEX locations_location_idx ON locations USING GIST(location)');
        DB::statement('CREATE INDEX locations_geofence_idx ON locations USING GIST(geofence)');
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
