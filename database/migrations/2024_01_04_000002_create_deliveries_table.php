<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('order_id')->constrained('orders')->cascadeOnDelete();
            
            $table->string('tracking_number')->unique()->comment('Unguessable tracking number');
            $table->decimal('weight_kg', 6, 2)->nullable();
            
            // Snapshot of destination
            $table->text('dropoff_address')->nullable();
            $table->geometry('dropoff_location', subtype: 'point')->nullable();
            
            $table->enum('status', ['pending', 'at_hub', 'linehaul', 'out_for_delivery', 'delivered', 'failed'])->default('pending');
            
            $table->foreignUlid('origin_hub_id')->nullable()->constrained('locations');
            $table->foreignUlid('current_hub_id')->nullable()->constrained('locations');
            
            $table->foreignUlid('route_id')->nullable()->constrained('routes')->nullOnDelete();
            $table->foreignUlid('driver_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
