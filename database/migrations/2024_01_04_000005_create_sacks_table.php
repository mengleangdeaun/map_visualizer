<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sacks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->string('barcode')->unique();
            $table->foreignUlid('origin_hub_id')->constrained('locations');
            $table->foreignUlid('dest_hub_id')->constrained('locations');
            $table->enum('status', ['open', 'sealed', 'in_transit', 'received'])->default('open');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sacks');
    }
};
