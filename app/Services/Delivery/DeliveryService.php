<?php

namespace App\Services\Delivery;

use App\Models\Delivery\Delivery;
use App\Models\Delivery\Order;
use App\Models\Delivery\OrderItem;
use App\Services\Admin\Fleet\DocumentNumberingService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeliveryService
{
    protected $documentNumberingService;

    public function __construct(DocumentNumberingService $documentNumberingService)
    {
        $this->documentNumberingService = $documentNumberingService;
    }
    /**
     * Find a delivery by ID with spatial and relational data.
     */
    public function findById(string $id, ?string $companyId = null): Delivery
    {
        $query = Delivery::query()
            ->select('*')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_latitude')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_longitude');

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        return $query->with([
            'order.customer',
            'order.items',
            'order.deliveries' => function ($q) {
                $q->select('*')
                  ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_latitude')
                  ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_longitude');
            },
            'driver',
            'driver.vehicles' => function ($q) {
                $q->select('*')
                  ->selectRaw('ST_Y(last_location::geometry) as latitude')
                  ->selectRaw('ST_X(last_location::geometry) as longitude');
            },
            'originHub',
            'currentHub'
        ])->findOrFail($id);
    }

    /**
     * List deliveries with pagination and advanced filtering/search.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $companyId = $params['company_id'] ?? null;
        $search = $params['search'] ?? null;
        $status = $params['status'] ?? null;

        $query = Delivery::query()
            ->select('*')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_latitude')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_longitude')
            ->with([
                'order.customer',
                'order.items',
                'order.deliveries' => function ($q) {
                    $q->select('*')
                      ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_latitude')
                      ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_longitude');
                },
                'driver',
                'driver.vehicles' => function ($q) {
                    $q->select('*')
                      ->selectRaw('ST_Y(last_location::geometry) as latitude')
                      ->selectRaw('ST_X(last_location::geometry) as longitude');
                },
                'originHub',
                'currentHub'
            ]);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                // Search by tracking number
                $q->where('tracking_number', 'LIKE', "%{$search}%")
                  ->orWhereHas('order', function ($oq) use ($search) {
                      // Search by order number or customer name
                      $oq->where('order_number', 'LIKE', "%{$search}%")
                         ->orWhereHas('customer', function ($cq) use ($search) {
                             $cq->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('phone', 'LIKE', "%{$search}%");
                         });
                  });
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new order, items, and delivery in a single transaction.
     */
    public function create(array $data): Delivery
    {
        return DB::transaction(function () use ($data) {
            $companyId = $data['company_id'];

            // 1. Create the Order
            $orderNumber = $this->documentNumberingService->generateNextNumberByScope('order', $companyId)
                ?? ('ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6)));
            
            $order = Order::create([
                'company_id' => $companyId,
                'customer_id' => $data['customer_id'],
                'order_number' => $orderNumber,
                'order_date' => isset($data['order_date']) ? $data['order_date'] : now(),
                'status' => $data['order_status'] ?? 'pending',
                'currency_code' => $data['currency_code'] ?? 'USD',
                'exchange_rate' => $data['exchange_rate'] ?? 1.000000,
                'subtotal' => $data['subtotal'] ?? 0.00,
                'subtotal_khr' => $data['subtotal_khr'] ?? 0.00,
                'taxable_amount' => $data['taxable_amount'] ?? 0.00,
                'tax_percent' => $data['tax_percent'] ?? 0.00,
                'tax_total' => $data['tax_total'] ?? 0.00,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? 0.00,
                'discount_total' => $data['discount_total'] ?? 0.00,
                'grand_total' => $data['grand_total'],
                'grand_total_khr' => $data['grand_total_khr'] ?? 0.00,
                'paid_amount' => $data['paid_amount'] ?? 0.00,
                'balance_amount' => $data['balance_amount'] ?? 0.00,
                'payment_status' => $data['payment_status'] ?? 'unpaid',
                'amount_due_cod' => $data['amount_due_cod'] ?? 0.00,
                'payment_method' => $data['payment_method'],
            ]);

            // 2. Create the Order Items
            foreach ($data['items'] as $item) {
                $qty = (int) $item['quantity'];
                $price = (float) $item['unit_price'];
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_name' => $item['product_name'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'total_price' => $qty * $price,
                ]);
            }

            // 3. Create the Deliveries (Stops)
            $deliveries = [];
            $stops = isset($data['stops']) ? $data['stops'] : [[
                'weight_kg' => $data['weight_kg'] ?? null,
                'dropoff_address' => $data['dropoff_address'] ?? null,
                'dropoff_latitude' => $data['dropoff_latitude'] ?? null,
                'dropoff_longitude' => $data['dropoff_longitude'] ?? null,
                'origin_hub_id' => $data['origin_hub_id'] ?? null,
                'current_hub_id' => $data['current_hub_id'] ?? null,
                'driver_id' => $data['driver_id'] ?? null,
                'sequence_number' => $data['sequence_number'] ?? 1,
                'status' => 'pending',
            ]];

            foreach ($stops as $idx => $stop) {
                $trackingNumber = $this->documentNumberingService->generateNextNumberByScope('tracking', $companyId)
                    ?? ('TRK-' . date('ymd') . '-' . strtoupper(Str::random(8)) . '-' . ($idx + 1));
                
                $deliveryData = [
                    'company_id' => $companyId,
                    'order_id' => $order->id,
                    'tracking_number' => $trackingNumber,
                    'weight_kg' => isset($stop['weight_kg']) ? (float) $stop['weight_kg'] : null,
                    'dropoff_address' => $stop['dropoff_address'] ?? null,
                    'status' => $stop['status'] ?? 'pending',
                    'origin_hub_id' => $stop['origin_hub_id'] ?? null,
                    'current_hub_id' => $stop['current_hub_id'] ?? null,
                    'driver_id' => $stop['driver_id'] ?? null,
                    'sequence_number' => isset($stop['sequence_number']) ? (int) $stop['sequence_number'] : ($idx + 1),
                    'scheduled_at' => $stop['scheduled_at'] ?? null,
                ];

                if (isset($stop['dropoff_latitude']) && isset($stop['dropoff_longitude'])) {
                    $lat = (float) $stop['dropoff_latitude'];
                    $lng = (float) $stop['dropoff_longitude'];
                    $deliveryData['dropoff_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
                }

                $newDelivery = Delivery::create($deliveryData);
                $deliveries[] = $newDelivery;
            }

            return $this->findById($deliveries[0]->id, $companyId);
        });
    }

    /**
     * Update an existing delivery record.
     */
    public function update(Delivery $delivery, array $data): Delivery
    {
        return DB::transaction(function () use ($delivery, $data) {
            // Handle PostGIS Spatial Point updates
            if (isset($data['dropoff_latitude']) && isset($data['dropoff_longitude'])) {
                $lat = (float) $data['dropoff_latitude'];
                $lng = (float) $data['dropoff_longitude'];
                $data['dropoff_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
                unset($data['dropoff_latitude'], $data['dropoff_longitude']);
            }

            // If order updates are provided
            if (isset($data['customer_id']) || isset($data['items'])) {
                $order = $delivery->order;
                if ($order) {
                    $orderData = [];
                    if (isset($data['customer_id'])) $orderData['customer_id'] = $data['customer_id'];
                    if (isset($data['payment_method'])) $orderData['payment_method'] = $data['payment_method'];
                    if (isset($data['currency_code'])) $orderData['currency_code'] = $data['currency_code'];
                    if (isset($data['order_date'])) $orderData['order_date'] = $data['order_date'];
                    if (isset($data['exchange_rate'])) $orderData['exchange_rate'] = $data['exchange_rate'];
                    if (isset($data['subtotal'])) $orderData['subtotal'] = $data['subtotal'];
                    if (isset($data['subtotal_khr'])) $orderData['subtotal_khr'] = $data['subtotal_khr'];
                    if (isset($data['taxable_amount'])) $orderData['taxable_amount'] = $data['taxable_amount'];
                    if (isset($data['tax_percent'])) $orderData['tax_percent'] = $data['tax_percent'];
                    if (isset($data['tax_total'])) $orderData['tax_total'] = $data['tax_total'];
                    if (isset($data['discount_type'])) $orderData['discount_type'] = $data['discount_type'];
                    if (isset($data['discount_value'])) $orderData['discount_value'] = $data['discount_value'];
                    if (isset($data['discount_total'])) $orderData['discount_total'] = $data['discount_total'];
                    if (isset($data['grand_total'])) $orderData['grand_total'] = $data['grand_total'];
                    if (isset($data['grand_total_khr'])) $orderData['grand_total_khr'] = $data['grand_total_khr'];
                    if (isset($data['paid_amount'])) $orderData['paid_amount'] = $data['paid_amount'];
                    if (isset($data['balance_amount'])) $orderData['balance_amount'] = $data['balance_amount'];
                    if (isset($data['payment_status'])) $orderData['payment_status'] = $data['payment_status'];
                    if (isset($data['amount_due_cod'])) $orderData['amount_due_cod'] = $data['amount_due_cod'];
                    if (isset($data['order_status'])) $orderData['status'] = $data['order_status'];

                    $order->update($orderData);

                    // Update order items if provided
                    if (isset($data['items'])) {
                        // Delete old items and recreate
                        $order->items()->delete();
                        foreach ($data['items'] as $item) {
                            $qty = (int) $item['quantity'];
                            $price = (float) $item['unit_price'];
                            
                            OrderItem::create([
                                'order_id' => $order->id,
                                'product_name' => $item['product_name'],
                                'quantity' => $qty,
                                'unit_price' => $price,
                                'total_price' => $qty * $price,
                            ]);
                        }
                    }
                }
            }

            // If stops updates are provided
            if (isset($data['stops'])) {
                $delivery->order->deliveries()->delete();
                
                $deliveries = [];
                foreach ($data['stops'] as $idx => $stop) {
                    $trackingNumber = $this->documentNumberingService->generateNextNumberByScope('tracking', $delivery->company_id)
                        ?? ('TRK-' . date('ymd') . '-' . strtoupper(Str::random(8)) . '-' . ($idx + 1));
                    
                    $deliveryData = [
                        'company_id' => $delivery->company_id,
                        'order_id' => $delivery->order_id,
                        'tracking_number' => $trackingNumber,
                        'weight_kg' => isset($stop['weight_kg']) ? (float) $stop['weight_kg'] : null,
                        'dropoff_address' => $stop['dropoff_address'] ?? null,
                        'status' => $stop['status'] ?? 'pending',
                        'origin_hub_id' => $stop['origin_hub_id'] ?? null,
                        'current_hub_id' => $stop['current_hub_id'] ?? null,
                        'driver_id' => $stop['driver_id'] ?? null,
                        'sequence_number' => isset($stop['sequence_number']) ? (int) $stop['sequence_number'] : ($idx + 1),
                        'scheduled_at' => $stop['scheduled_at'] ?? null,
                    ];

                    if (isset($stop['dropoff_latitude']) && isset($stop['dropoff_longitude'])) {
                        $lat = (float) $stop['dropoff_latitude'];
                        $lng = (float) $stop['dropoff_longitude'];
                        $deliveryData['dropoff_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
                    }

                    $newDelivery = Delivery::create($deliveryData);
                    $deliveries[] = $newDelivery;
                }
                
                return $this->findById($deliveries[0]->id, $delivery->company_id);
            }

            // Exclude non-delivery table fields from delivery updates
            $deliveryFields = [
                'weight_kg', 'dropoff_address', 'dropoff_location', 'status',
                'origin_hub_id', 'current_hub_id', 'driver_id', 'sequence_number', 'scheduled_at'
            ];
            $deliveryData = array_intersect_key($data, array_flip($deliveryFields));

            $delivery->update($deliveryData);

            return $this->findById($delivery->id, $delivery->company_id);
        });
    }

    /**
     * Delete a delivery and its associated order + items inside a transaction.
     */
    public function delete(Delivery $delivery): bool
    {
        return DB::transaction(function () use ($delivery) {
            $order = $delivery->order;
            
            // Delete delivery first to satisfy any internal constraints
            $delivery->delete();

            // Cascade delete the order (which deletes order items via database cascade)
            if ($order) {
                $order->delete();
            }

            return true;
        });
    }
}
