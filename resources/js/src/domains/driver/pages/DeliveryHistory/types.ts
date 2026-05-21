export interface Customer {
    id: string;
    name: string;
    phone?: string;
}

export interface Order {
    id: string;
    order_number: string;
    grand_total: number;
    amount_due_cod: number;
    payment_method: string;
    payment_status: string;
    customer?: Customer | null;
}

export interface ProofOfDelivery {
    id: string;
    photo_url?: string | null;
    notes?: string | null;
    receiver_name?: string | null;
}

export interface HistoricalDelivery {
    id: string;
    tracking_number: string;
    weight_kg: number;
    dropoff_address: string;
    status: string;
    started_at?: string | null;
    completed_at?: string | null;
    lng?: number | null;
    lat?: number | null;
    order?: Order | null;
    proof_of_delivery?: ProofOfDelivery | null;
}

export interface HistoricalStop {
    id: string;
    sequence_number: number;
    status: 'pending' | 'in_transit' | 'arrived' | 'completed' | 'skipped';
    eta?: string | null;
    arrived_at?: string | null;
    completed_at?: string | null;
    notes?: string | null;
    delivery?: HistoricalDelivery | null;
}

export interface Hub {
    id: string;
    code: string;
    name: string;
}

export interface HistoricalRoute {
    id: string;
    date: string;
    status: 'optimized' | 'in_progress' | 'completed';
    notes?: string | null;
    total_weight_kg: number;
    stop_count: number;
    estimated_distance_km: number;
    estimated_duration_min: number;
    hub?: Hub | null;
    stops: HistoricalStop[];
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
