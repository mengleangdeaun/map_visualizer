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
        Schema::table('company_telegram_settings', function (Blueprint $table) {
            $table->json('event_settings')->nullable();
            $table->json('allowed_events')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_telegram_settings', function (Blueprint $table) {
            $table->dropColumn(['event_settings', 'allowed_events']);
        });
    }
};
