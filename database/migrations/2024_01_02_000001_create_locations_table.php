<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->string('code')->nullable(); // e.g., 'HUB-PNH-01'
            $table->string('name');
            $table->enum('type', ['main_sort', 'regional_hub', 'local_node']);
            
            // PostGIS spatial columns
            $table->geometry('location', subtype: 'point')->nullable();
            $table->geometry('geofence', subtype: 'polygon')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
