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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('exchange_rate_mode')->default('global')->after('status');
            $table->decimal('exchange_rate_override_value', 15, 6)->nullable()->after('exchange_rate_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate_mode', 'exchange_rate_override_value']);
        });
    }
};
