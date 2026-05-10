<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('delivery_issues', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUlid('delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->foreignUlid('driver_id')->constrained('users')->cascadeOnDelete();
            $table->enum('issue_type', ['severe_weather', 'vehicle_breakdown', 'customer_unreachable', 'package_damaged']);
            $table->string('photo_url')->nullable();
            $table->enum('status', ['open', 'investigating', 'resolved'])->default('open');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('delivery_issues'); }
};
