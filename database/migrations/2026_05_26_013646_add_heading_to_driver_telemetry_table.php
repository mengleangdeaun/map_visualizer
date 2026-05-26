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
        Schema::table('driver_telemetry', function (Blueprint $table) {
            $table->integer('heading')->nullable()->after('speed_kmh');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_telemetry', function (Blueprint $table) {
            $table->dropColumn('heading');
        });
    }
};
