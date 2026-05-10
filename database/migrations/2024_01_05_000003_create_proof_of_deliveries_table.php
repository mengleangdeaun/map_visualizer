<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('proof_of_deliveries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->constrained('users')->cascadeOnDelete();
            $table->string('receiver_name')->nullable();
            $table->string('signature_url')->nullable();
            $table->string('photo_url')->nullable();
            $table->geometry('captured_location', subtype: 'point')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('proof_of_deliveries'); }
};
