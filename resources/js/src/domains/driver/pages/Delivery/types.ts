import { RouteStop } from '../StopDetails/types';

export interface ActiveRoute {
    id: string;
    date: string;
    status: string;
    stop_count: number;
    estimated_distance_km: number;
    estimated_duration_min: number;
    stops: RouteStop[];
}

export interface StopCardProps {
    stop: RouteStop;
    currentTime: number;
    isArrivePending: boolean;
    updatingStopId: string | null;
    onArrive: (stopId: string) => void;
    t: (key: string) => string;
}

export interface DeliveryProgressCardProps {
    completedCount: number;
    totalStops: number;
    totalCod: number;
    t: (key: string) => string;
}
