<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->constrained('users');
            $table->foreignUlid('hub_id')->constrained('locations');
            
            $table->date('date');
            $table->enum('status', ['draft', 'optimized', 'in_progress', 'completed'])->default('draft');
            $table->decimal('cash_to_remit', 10, 2)->default(0)->comment('Expected COD total');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
