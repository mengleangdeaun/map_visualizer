<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('proof_of_deliveries', function (Blueprint $table) {
            // Drop signature_url if it exists
            if (Schema::hasColumn('proof_of_deliveries', 'signature_url')) {
                $table->dropColumn('signature_url');
            }

            // Add audit fields: created_by and updated_by
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proof_of_deliveries', function (Blueprint $table) {
            $table->string('signature_url')->nullable();
            $table->dropColumn(['created_by', 'updated_by']);
        });
    }
};
