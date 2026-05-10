<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_inspections', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->constrained('users')->cascadeOnDelete();
            
            $table->boolean('is_safe_to_drive');
            $table->jsonb('reported_issues')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_inspections');
    }
};
