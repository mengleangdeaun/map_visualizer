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
            
            $table->integer('sequence_number');
            $table->timestamp('eta')->nullable();
            $table->enum('status', ['pending', 'arrived', 'completed', 'skipped'])->default('pending');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_stops');
    }
};
