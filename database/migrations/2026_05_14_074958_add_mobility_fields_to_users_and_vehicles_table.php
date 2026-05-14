<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('operational_status', ['offline', 'online', 'busy'])->default('offline')->after('status');
            $table->json('permissions')->nullable()->after('operational_status');
        });

        // Add geometry column via raw SQL for better PostGIS control
        DB::statement('ALTER TABLE users ADD last_location GEOMETRY(POINT, 4326) NULL');
        DB::statement('CREATE INDEX users_last_location_idx ON users USING GIST(last_location)');

        Schema::table('vehicles', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('image_url');
        });

        DB::statement('ALTER TABLE vehicles ADD last_location GEOMETRY(POINT, 4326) NULL');
        DB::statement('CREATE INDEX vehicles_last_location_idx ON vehicles USING GIST(last_location)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['operational_status', 'permissions']);
        });
        
        DB::statement('ALTER TABLE users DROP COLUMN last_location');

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        DB::statement('ALTER TABLE vehicles DROP COLUMN last_location');
    }
};
