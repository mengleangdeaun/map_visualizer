// ── StopDetails Domain Types ──────────────────────────────────────────────────

export interface OrderItem {
    id: string;
    product_name: string;
    sku: string | null;
    quantity: number;
}

export interface OrderCustomer {
    id: string;
    name: string;
    phone: string;
}

export interface OrderDetail {
    id: string;
    order_number: string;
    total_amount: number;
    amount_due_cod: number;
    payment_method: string;
    payment_status: string;
    customer: OrderCustomer;
    items: OrderItem[];
}

export interface DeliveryDetail {
    id: string;
    tracking_number: string;
    weight_kg: number;
    dropoff_address: string;
    lng: number | null;
    lat: number | null;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    scheduled_at: string | null;
    order: OrderDetail;
}

export interface RouteStop {
    id: string;
    sequence_number: number;
    status: 'pending' | 'in_transit' | 'arrived' | 'completed' | 'skipped';
    eta: string | null;
    arrived_at: string | null;
    completed_at: string | null;
    delivery: DeliveryDetail;
}
