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
        // Drop the Postgres check constraint that was left behind from the enum column
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way to restore the exact enum check constraint without knowing the exact definition
        // But we usually don't want to revert to a broken state anyway.
    }
};
