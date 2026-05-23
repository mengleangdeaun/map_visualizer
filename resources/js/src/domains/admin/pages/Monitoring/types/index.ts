import { RoadblockType } from '@/domains/admin/utils/roadBlockType';

export type SelectionMode = 'none' | 'task_pickup' | 'task_dropoff' | 'delivery_dropoff' | 'road_alert';

export interface MonitoringFocusTarget {
    id: string;
    type: 'vehicle' | 'hub' | 'task' | 'delivery';
    center: [number, number];
}

export interface MonitoringViewport {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
}

export interface Roadblock {
    id: string | number;
    lat: number | string;
    lng: number | string;
    type: RoadblockType | string;
    description?: string;
    created_at: string;
}
