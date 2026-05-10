<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('original_delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->ulid('new_tracking_num')->unique();
            $table->enum('reason', ['refused', 'address_invalid', 'max_attempts_reached']);
            $table->enum('status', ['pending_pickup', 'returning', 'returned'])->default('pending_pickup');
            $table->decimal('return_fee', 10, 2)->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('return_requests'); }
};
