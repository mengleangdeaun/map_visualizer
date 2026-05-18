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
        Schema::create('vehicle_shifts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('status')->default('active'); // active, completed
            $table->timestamps();

            $table->index(['driver_id', 'status']);
            $table->index(['vehicle_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_shifts');
    }
};
