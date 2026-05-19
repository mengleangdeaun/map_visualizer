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
            $table->decimal('subtotal_amount', 12, 2)->default(0.00)->after('exchange_rate_snap');
            $table->enum('discount_type', ['percentage', 'fixed'])->nullable()->after('subtotal_amount');
            $table->decimal('discount_value', 12, 2)->default(0.00)->after('discount_type');
            $table->decimal('discount_amount', 12, 2)->default(0.00)->after('discount_value');
            $table->decimal('vat_percentage', 5, 2)->default(0.00)->after('discount_amount');
            $table->decimal('vat_amount', 12, 2)->default(0.00)->after('vat_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal_amount',
                'discount_type',
                'discount_value',
                'discount_amount',
                'vat_percentage',
                'vat_amount',
            ]);
        });
    }
};
