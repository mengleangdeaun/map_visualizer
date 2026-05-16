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
        Schema::table('tasks', function (Blueprint $table) {
            // Remove logistics-specific columns
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['customer_id', 'source', 'external_order_id']);
            
            // Rename receiver columns to contact columns for internal errands
            $table->renameColumn('receiver_name', 'contact_name');
            $table->renameColumn('receiver_phone', 'contact_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignUlid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('source')->default('manual');
            $table->string('external_order_id')->nullable();
            
            $table->renameColumn('contact_name', 'receiver_name');
            $table->renameColumn('contact_phone', 'receiver_phone');
        });
    }
};
