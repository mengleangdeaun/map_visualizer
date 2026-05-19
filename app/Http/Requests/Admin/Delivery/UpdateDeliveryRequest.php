<?php

namespace App\Http\Requests\Admin\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Logistics
            'status' => 'nullable|string|in:pending,at_hub,linehaul,out_for_delivery,delivered,failed',
            'driver_id' => 'nullable|exists:users,id',
            'origin_hub_id' => 'nullable|exists:locations,id',
            'current_hub_id' => 'nullable|exists:locations,id',
            'weight_kg' => 'nullable|numeric|min:0',
            'dropoff_address' => 'nullable|string',
            'dropoff_latitude' => 'nullable|numeric|between:-90,90',
            'dropoff_longitude' => 'nullable|numeric|between:-180,180',
            'sequence_number' => 'nullable|integer|min:1',

            // Multi-stop support
            'stops' => 'nullable|array',
            'stops.*.weight_kg' => 'nullable|numeric|min:0',
            'stops.*.dropoff_address' => 'nullable|string',
            'stops.*.dropoff_latitude' => 'nullable|numeric|between:-90,90',
            'stops.*.dropoff_longitude' => 'nullable|numeric|between:-180,180',
            'stops.*.origin_hub_id' => 'nullable|exists:locations,id',
            'stops.*.current_hub_id' => 'nullable|exists:locations,id',
            'stops.*.driver_id' => 'nullable|exists:users,id',
            'stops.*.sequence_number' => 'nullable|integer|min:1',
            'stops.*.status' => 'nullable|string|in:pending,at_hub,linehaul,out_for_delivery,delivered,failed',

            // Optional Order updates
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'nullable|string|in:cash,khqr,postpaid',
            'currency_code' => 'nullable|string|size:3',
            'order_date' => 'nullable|date',
            'exchange_rate' => 'nullable|numeric|min:0',
            'subtotal' => 'nullable|numeric|min:0',
            'subtotal_khr' => 'nullable|numeric|min:0',
            'taxable_amount' => 'nullable|numeric|min:0',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'tax_total' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|string|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_total' => 'nullable|numeric|min:0',
            'grand_total' => 'nullable|numeric|min:0',
            'grand_total_khr' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'balance_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|string|in:unpaid,partially_paid,paid',
            'order_status' => 'nullable|string|in:pending,paid,completed,cancelled',
            'amount_due_cod' => 'nullable|numeric|min:0',

            // Order items
            'items' => 'nullable|array|min:1',
            'items.*.product_name' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
        ];
    }
}
