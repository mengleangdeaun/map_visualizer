<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('author_id')->constrained('users');
            $table->text('message');
            $table->enum('channel', ['telegram', 'pwa_push', 'both']);
            $table->enum('target_audience', ['all_drivers', 'active_drivers', 'specific_hub', 'specific_users']);
            $table->foreignUlid('target_hub_id')->nullable()->constrained('locations');
            $table->enum('status', ['draft', 'sending', 'completed', 'failed'])->default('draft');
            $table->integer('success_count')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('broadcasts'); }
};
