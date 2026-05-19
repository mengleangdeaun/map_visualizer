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
        // 1. Drop foreign key constraint on deliveries table
        Schema::table('deliveries', function (Blueprint $table) {
            if (Schema::hasColumn('deliveries', 'route_id')) {
                $table->dropForeign(['route_id']);
                $table->dropColumn('route_id');
            }
        });

        // 2. Drop the route_stops table
        Schema::dropIfExists('route_stops');

        // 3. Drop the routes table
        Schema::dropIfExists('routes');

        // 4. Add sequence and status columns directly to deliveries table
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'sequence_number')) {
                $table->integer('sequence_number')->default(0);
            }
            if (!Schema::hasColumn('deliveries', 'eta')) {
                $table->timestamp('eta')->nullable();
            }
            if (!Schema::hasColumn('deliveries', 'route_status')) {
                $table->enum('route_status', ['pending', 'arrived', 'completed', 'skipped'])->default('pending');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate routes table
        Schema::create('routes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->constrained('users');
            $table->foreignUlid('hub_id')->constrained('locations');
            $table->date('date');
            $table->enum('status', ['draft', 'optimized', 'in_progress', 'completed'])->default('draft');
            $table->decimal('cash_to_remit', 10, 2)->default(0);
            $table->timestamps();
        });

        // Recreate route_stops table
        Schema::create('route_stops', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('route_id')->constrained('routes')->cascadeOnDelete();
            $table->foreignUlid('delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->integer('sequence_number');
            $table->timestamp('eta')->nullable();
            $table->enum('status', ['pending', 'arrived', 'completed', 'skipped'])->default('pending');
            $table->timestamps();
        });

        // Restore route_id column on deliveries table
        Schema::table('deliveries', function (Blueprint $table) {
            $table->foreignUlid('route_id')->nullable()->constrained('routes')->nullOnDelete();
        });

        // Drop sequence columns from deliveries table
        Schema::table('deliveries', function (Blueprint $table) {
            if (Schema::hasColumn('deliveries', 'sequence_number')) {
                $table->dropColumn('sequence_number');
            }
            if (Schema::hasColumn('deliveries', 'eta')) {
                $table->dropColumn('eta');
            }
            if (Schema::hasColumn('deliveries', 'route_status')) {
                $table->dropColumn('route_status');
            }
        });
    }
};
