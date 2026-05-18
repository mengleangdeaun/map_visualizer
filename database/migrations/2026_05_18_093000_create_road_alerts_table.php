<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('road_alerts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->text('description');
            $table->string('type')->default('blockage'); // blockage, accident, flood, traffic etc.
            
            // PostGIS spatial point for location
            $table->geometry('location', subtype: 'point')->nullable();
            
            // Audit trails
            $table->ulid('created_by')->nullable();
            $table->ulid('updated_by')->nullable();
            
            $table->timestamps();
            
            // Foreign key constraints for audit trails
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // Add PostGIS spatial GIST index
        DB::statement('CREATE INDEX road_alerts_location_idx ON road_alerts USING GIST(location)');
    }

    public function down(): void
    {
        Schema::table('road_alerts', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
        });
        
        DB::statement('DROP INDEX IF EXISTS road_alerts_location_idx');
        
        Schema::dropIfExists('road_alerts');
    }
};
