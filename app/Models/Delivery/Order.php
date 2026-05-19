<?php

namespace App\Models\Delivery;

use App\Models\Customer\Customer;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUlids, HasAuditFields;

    protected $fillable = [
        'company_id',
        'customer_id',
        'order_number',
        'order_date',
        'status',
        'currency_code',
        'exchange_rate',
        'subtotal',
        'subtotal_khr',
        'taxable_amount',
        'tax_percent',
        'tax_total',
        'discount_type',
        'discount_value',
        'discount_total',
        'grand_total',
        'grand_total_khr',
        'paid_amount',
        'balance_amount',
        'payment_status',
        'amount_due_cod',
        'payment_method',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'exchange_rate' => 'decimal:6',
        'subtotal' => 'decimal:2',
        'subtotal_khr' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'grand_total_khr' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'amount_due_cod' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class, 'order_id');
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'order_id');
    }
}
