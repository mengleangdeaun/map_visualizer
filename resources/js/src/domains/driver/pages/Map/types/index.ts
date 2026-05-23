export interface RoadblockAlert {
    id: string;
    description: string;
    type: string;
    lng: number;
    lat: number;
    created_at: string;
}

export interface MapViewport {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
}

export interface OrderItem {
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
}

export interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    amount_due_cod: number;
    payment_method: string;
    payment_status: string;
    customer: Customer | null;
    items?: OrderItem[];
}

export interface DeliveryDetails {
    id: string;
    tracking_number: string;
    weight_kg: number;
    dropoff_address: string;
    lng: number;
    lat: number;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    scheduled_at: string | null;
    order?: Order | null;
}

export interface StopItem {
    id: string;
    sequence_number: number;
    eta: string | null;
    status: 'pending' | 'in_transit' | 'arrived' | 'completed' | 'skipped';
    arrived_at: string | null;
    completed_at: string | null;
    delivery: DeliveryDetails;
}

export interface RouteData {
    id: string;
    status: string;
    cash_to_remit: number;
    date: string;
    stops: StopItem[];
}

export interface ErrandTask {
    id: string;
    company_id: string;
    driver_id: string;
    title: string;
    description: string | null;
    status: 'assigned' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
    pickup_address: string | null;
    pickup_lat: number | null;
    pickup_lng: number | null;
    dropoff_address: string | null;
    dropoff_lat: number | null;
    dropoff_lng: number | null;
    scheduled_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}

export interface CustomRoute {
    coordinates: [number, number][];
    distance: number;
    duration: number;
}
