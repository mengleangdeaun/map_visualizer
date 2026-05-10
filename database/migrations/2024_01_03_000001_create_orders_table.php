<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('customer_id')->constrained('customers');
            
            $table->string('order_number')->unique(); // Human readable e.g., ORD-2026-991
            $table->enum('status', ['pending', 'paid', 'completed', 'cancelled'])->default('pending');
            
            // Financial Snapshotting
            $table->string('currency_code', 3);
            $table->decimal('exchange_rate_snap', 15, 6)->comment('Locked at creation to prevent historical shifts');
            $table->decimal('total_amount', 12, 2)->comment('Total in order currency');
            $table->decimal('amount_due_cod', 12, 2)->default(0)->comment('Cash to collect');
            $table->enum('payment_method', ['cash', 'khqr', 'postpaid']);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
