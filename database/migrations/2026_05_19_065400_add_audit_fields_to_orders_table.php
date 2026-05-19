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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'created_by')) {
                $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('orders', 'updated_by')) {
                $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'created_by')) {
                $table->dropForeign(['orders_created_by_foreign']);
                $table->dropColumn('created_by');
            }
            if (Schema::hasColumn('orders', 'updated_by')) {
                $table->dropForeign(['orders_updated_by_foreign']);
                $table->dropColumn('updated_by');
            }
        });
    }
};
