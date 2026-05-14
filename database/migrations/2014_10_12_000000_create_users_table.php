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
        Schema::create('users', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->enum('role', ['admin', 'dispatcher', 'hub_operator', 'driver'])->index();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('telegram_user_id')->nullable();
            
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->ulid('base_hub_id')->nullable(); // Foreign key to locations (added logically, schema constraint can be added after locations table exists)
            
            $table->enum('status', ['active', 'suspended', 'inactive'])->default('active');
            $table->string('profile_url')->nullable();

            $table->rememberToken();
            $table->timestamps();
            
            // Unique constraints within a single company
            $table->unique(['company_id', 'phone']);
            $table->unique(['company_id', 'telegram_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
