<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('document_number_settings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            
            $table->string('name');
            $table->string('prefix')->nullable();
            $table->string('suffix')->nullable();
            $table->string('date_format')->nullable(); // e.g. None, YYYY, YY, YYYYMM, YYYYMMDD
            $table->string('separator')->nullable();   // e.g. None, -, /, _
            $table->integer('digit_padding')->default(5);
            $table->integer('next_number')->default(1);
            $table->string('reset_frequency')->default('None'); // None, Daily, Monthly, Yearly
            $table->string('sequence_scope')->nullable();       // e.g. order, tracking, task, invoice
            $table->string('template')->default('{PREFIX}-{YYYY}-{SEQ}');
            $table->boolean('is_active')->default(true);
            
            // Last reset timestamp for scheduling
            $table->timestamp('last_reset_at')->nullable();
            
            // Audit columns for HasAuditFields trait
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();

            // Indexes and constraints
            $table->index(['company_id', 'is_active']);
            $table->unique(['company_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_number_settings');
    }
};
