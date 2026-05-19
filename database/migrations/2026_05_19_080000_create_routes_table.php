<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('hub_id')->nullable()->constrained('locations')->nullOnDelete();

            $table->date('date')->comment('The planned trip date for this route');
            $table->enum('status', ['draft', 'optimized', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();

            // Cached computed stats (updated when stops change)
            $table->decimal('total_weight_kg', 8, 2)->default(0);
            $table->integer('stop_count')->default(0);
            $table->decimal('estimated_distance_km', 8, 2)->nullable()->comment('OSRM-computed total road distance');
            $table->integer('estimated_duration_min')->nullable()->comment('OSRM-computed total driving minutes');

            // Timestamps
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
