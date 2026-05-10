<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manifests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->string('manifest_code')->unique();
            $table->foreignUlid('departure_hub_id')->constrained('locations');
            $table->foreignUlid('arrival_hub_id')->constrained('locations');
            $table->foreignUlid('driver_id')->constrained('users');
            
            $table->enum('status', ['loading', 'in_transit', 'arrived', 'unloaded'])->default('loading');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manifests');
    }
};
