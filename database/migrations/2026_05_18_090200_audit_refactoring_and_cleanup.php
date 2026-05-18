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
        // 1. Remove last_location from users table
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'last_location')) {
                $table->dropColumn('last_location');
            }
        });

        // 2. Add created_by and updated_by columns to 10 tables
        $tables = [
            'companies',
            'customers',
            'users',
            'deliveries',
            'locations',
            'manifests',
            'vehicles',
            'vehicle_shifts',
            'zones',
            'tasks'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'created_by')) {
                    $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
                }
                if (!Schema::hasColumn($tableName, 'updated_by')) {
                    $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'companies',
            'customers',
            'users',
            'deliveries',
            'locations',
            'manifests',
            'vehicles',
            'vehicle_shifts',
            'zones',
            'tasks'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'created_by')) {
                    $table->dropForeign([$tableName . '_created_by_foreign']);
                    $table->dropColumn('created_by');
                }
                if (Schema::hasColumn($tableName, 'updated_by')) {
                    $table->dropForeign([$tableName . '_updated_by_foreign']);
                    $table->dropColumn('updated_by');
                }
            });
        }

        // Re-add last_location to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'last_location')) {
                DB::statement('ALTER TABLE users ADD last_location GEOMETRY(POINT, 4326) NULL');
                DB::statement('CREATE INDEX users_last_location_idx ON users USING GIST(last_location)');
            }
        });
    }
};
