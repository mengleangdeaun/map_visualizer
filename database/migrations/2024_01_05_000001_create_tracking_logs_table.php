<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tracking_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->string('status_code');
            $table->string('description');
            $table->foreignUlid('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('tracking_logs'); }
};
