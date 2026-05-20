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
        // 1. Update tasks table
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('scheduled_at');
            }
        });

        // 2. Update deliveries table
        Schema::table('deliveries', function (Blueprint $table) {
            // Convert status enum to string for flexibility (supporting rescheduled, etc.)
            $table->string('status')->default('pending')->change();

            if (!Schema::hasColumn('deliveries', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('deliveries', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('started_at');
            }
            if (!Schema::hasColumn('deliveries', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('scheduled_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['started_at']);
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'scheduled_at', 'completed_at']);
        });
    }
};
