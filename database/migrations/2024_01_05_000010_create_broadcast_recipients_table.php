<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('broadcast_recipients', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('broadcast_id')->constrained('broadcasts')->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'delivered', 'failed', 'read'])->default('pending');
            $table->string('error_message')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('broadcast_recipients'); }
};
