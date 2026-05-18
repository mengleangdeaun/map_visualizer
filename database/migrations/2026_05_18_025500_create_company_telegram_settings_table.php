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
        Schema::create('company_telegram_settings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->unique()->constrained('companies')->cascadeOnDelete();
            $table->string('bot_token')->nullable();
            $table->string('company_chat_id')->nullable();
            $table->boolean('notify_pwa')->default(true);
            $table->boolean('notify_driver_telegram')->default(true);
            $table->boolean('notify_company_telegram')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_telegram_settings');
    }
};
