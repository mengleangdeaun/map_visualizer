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
            // Rename columns
            $table->renameColumn('subtotal_amount', 'subtotal');
            $table->renameColumn('discount_amount', 'discount_total');
            $table->renameColumn('vat_percentage', 'tax_percent');
            $table->renameColumn('vat_amount', 'tax_total');
            $table->renameColumn('total_amount', 'grand_total');
            $table->renameColumn('exchange_rate_snap', 'exchange_rate');
        });

        Schema::table('orders', function (Blueprint $table) {
            // Add new columns
            $table->dateTime('order_date')->nullable()->after('customer_id');
            $table->decimal('taxable_amount', 12, 2)->default(0.00)->after('discount_total');
            $table->decimal('paid_amount', 12, 2)->default(0.00)->after('amount_due_cod');
            $table->decimal('balance_amount', 12, 2)->default(0.00)->after('paid_amount');
            $table->decimal('subtotal_khr', 15, 2)->default(0.00)->after('subtotal');
            $table->decimal('grand_total_khr', 15, 2)->default(0.00)->after('grand_total');
            $table->string('payment_status', 20)->default('unpaid')->after('balance_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_date',
                'taxable_amount',
                'paid_amount',
                'balance_amount',
                'subtotal_khr',
                'grand_total_khr',
                'payment_status',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('subtotal', 'subtotal_amount');
            $table->renameColumn('discount_total', 'discount_amount');
            $table->renameColumn('tax_percent', 'vat_percentage');
            $table->renameColumn('tax_total', 'vat_amount');
            $table->renameColumn('grand_total', 'total_amount');
            $table->renameColumn('exchange_rate', 'exchange_rate_snap');
        });
    }
};
