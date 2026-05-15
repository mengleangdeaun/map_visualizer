<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('driver_telemetry', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('driver_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->integer('speed_kmh')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });

        DB::statement('ALTER TABLE driver_telemetry ADD location GEOMETRY(POINT, 4326) NULL');
        DB::statement('CREATE INDEX driver_telemetry_location_idx ON driver_telemetry USING GIST(location)');
    }
    public function down(): void { Schema::dropIfExists('driver_telemetry'); }
};
