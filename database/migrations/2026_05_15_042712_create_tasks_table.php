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
        Schema::create('tasks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignUlid('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            
            $table->string('source')->default('manual'); // manual, external
            $table->string('external_order_id')->nullable();
            
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending, assigned, in_progress, completed, cancelled
            
            $table->string('receiver_name')->nullable();
            $table->string('receiver_phone')->nullable();
            
            $table->text('pickup_address')->nullable();
            $table->text('dropoff_address')->nullable();
            
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
        });

        // Add PostGIS spatial columns via raw SQL for better SRID control
        DB::statement('ALTER TABLE tasks ADD pickup_location GEOMETRY(POINT, 4326) NULL');
        DB::statement('ALTER TABLE tasks ADD dropoff_location GEOMETRY(POINT, 4326) NULL');
        
        DB::statement('CREATE INDEX tasks_pickup_location_idx ON tasks USING GIST(pickup_location)');
        DB::statement('CREATE INDEX tasks_dropoff_location_idx ON tasks USING GIST(dropoff_location)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
