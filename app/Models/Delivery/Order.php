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
        'status', // pending, paid, completed, cancelled
        'currency_code',
        'exchange_rate_snap',
        'total_amount',
        'amount_due_cod',
        'payment_method', // cash, khqr, postpaid
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'exchange_rate_snap' => 'decimal:6',
        'total_amount' => 'decimal:2',
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
}
