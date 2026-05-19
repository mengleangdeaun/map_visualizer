import api from '@/lib/api';
import { Customer } from './customerService';
import { Location } from '../../fleet/services/locationService';
import { User } from './userService';

export interface OrderItem {
    id: string;
    order_id: string;
    product_name: string;
    sku?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at?: string;
    updated_at?: string;
}

export interface Order {
    id: string;
    company_id: string;
    customer_id: string;
    order_number: string;
    order_date?: string;
    status: 'pending' | 'paid' | 'completed' | 'cancelled';
    currency_code: string;
    exchange_rate: number;
    subtotal: number;
    subtotal_khr?: number;
    taxable_amount?: number;
    tax_percent?: number;
    tax_total?: number;
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number;
    discount_total: number;
    grand_total: number;
    grand_total_khr?: number;
    paid_amount?: number;
    balance_amount?: number;
    payment_status?: 'unpaid' | 'partially_paid' | 'paid';
    amount_due_cod: number;
    payment_method: 'cash' | 'khqr' | 'postpaid';
    customer?: Customer;
    items?: OrderItem[];
    deliveries?: Delivery[];
    created_at: string;
    updated_at: string;
}

export interface Delivery {
    id: string;
    company_id: string;
    order_id: string;
    tracking_number: string;
    weight_kg: number | null;
    dropoff_address: string | null;
    dropoff_latitude: number | null;
    dropoff_longitude: number | null;
    status: 'pending' | 'at_hub' | 'linehaul' | 'out_for_delivery' | 'delivered' | 'failed';
    origin_hub_id: string | null;
    current_hub_id: string | null;
    route_id: string | null;
    driver_id: string | null;
    sequence_number?: number | null;
    order?: Order;
    driver?: User;
    origin_hub?: Location;
    current_hub?: Location;
    created_at: string;
    updated_at: string;
}

export interface PaginatedDeliveries {
    data: Delivery[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

export const deliveryService = {
    getDeliveries: async (params: any = {}): Promise<PaginatedDeliveries> => {
        const { data } = await api.get<PaginatedDeliveries>('/admin/fleet/deliveries', { params });
        return data;
    },

    getDelivery: async (id: string): Promise<Delivery> => {
        const { data } = await api.get<Delivery>(`/admin/fleet/deliveries/${id}`);
        return data;
    },

    createDelivery: async (data: any): Promise<Delivery> => {
        const response = await api.post('/admin/fleet/deliveries', data);
        return response.data.data;
    },

    updateDelivery: async (id: string, data: any): Promise<Delivery> => {
        const response = await api.put(`/admin/fleet/deliveries/${id}`, data);
        return response.data.data;
    },

    deleteDelivery: async (id: string): Promise<void> => {
        await api.delete(`/admin/fleet/deliveries/${id}`);
    },
};
