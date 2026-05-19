<?php

namespace App\Http\Requests\Admin\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Order details
            'customer_id' => 'required|exists:customers,id',
            'payment_method' => 'required|string|in:cash,khqr,postpaid',
            'currency_code' => 'required|string|size:3',
            'order_date' => 'nullable|date',
            'exchange_rate' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'subtotal_khr' => 'required|numeric|min:0',
            'taxable_amount' => 'required|numeric|min:0',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'tax_total' => 'required|numeric|min:0',
            'discount_type' => 'nullable|string|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_total' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'grand_total_khr' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'balance_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|string|in:unpaid,partially_paid,paid',
            'order_status' => 'nullable|string|in:pending,paid,completed,cancelled',
            'amount_due_cod' => 'required|numeric|min:0',

            // Order items list
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',

            // Delivery details
            'weight_kg' => 'nullable|numeric|min:0',
            'dropoff_address' => 'nullable|string',
            'dropoff_latitude' => 'nullable|numeric|between:-90,90',
            'dropoff_longitude' => 'nullable|numeric|between:-180,180',
            'origin_hub_id' => 'nullable|exists:locations,id',
            'current_hub_id' => 'nullable|exists:locations,id',
            'driver_id' => 'nullable|exists:users,id',
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
        ];
    }
}
