<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->foreignUlid('driver_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->enum('type', ['motorcycle', 'tuktuk', 'minivan', 'box_truck']);
            $table->string('plate_number');
            $table->decimal('max_weight_kg', 8, 2)->nullable();
            $table->decimal('max_volume_cbm', 8, 2)->nullable();
            
            $table->timestamps();
            
            $table->unique(['company_id', 'plate_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
