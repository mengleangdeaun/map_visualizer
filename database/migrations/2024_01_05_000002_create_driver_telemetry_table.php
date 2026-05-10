<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('driver_telemetry', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('driver_id')->constrained('users')->cascadeOnDelete();
            $table->geometry('location', subtype: 'point');
            $table->integer('speed_kmh')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('driver_telemetry'); }
};
