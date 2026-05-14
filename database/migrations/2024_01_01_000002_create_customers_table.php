<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('telegram_user_id')->nullable();
            
            $table->text('default_address')->nullable();
            $table->geometry('default_location', subtype: 'point')->nullable();
            $table->string('profile_url')->nullable();
            
            $table->integer('total_orders')->default(0);
            
            $table->timestamps();
            
            // Fast lookups
            $table->index(['company_id', 'phone']);
            $table->index(['company_id', 'telegram_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
