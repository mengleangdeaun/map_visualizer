<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sack_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('sack_id')->constrained('sacks')->cascadeOnDelete();
            $table->foreignUlid('delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sack_items');
    }
};
