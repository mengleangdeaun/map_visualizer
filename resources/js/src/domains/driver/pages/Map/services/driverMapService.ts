import api from '@/lib/api';
import { RouteData, RoadblockAlert, CustomRoute } from '../types';

export const driverMapService = {
    /**
     * Fetch active route and stops assigned to the driver
     */
    async fetchActiveRoute(): Promise<RouteData> {
        const { data } = await api.get('/driver/route/active');
        return data.data;
    },

    /**
     * Fetch active roadblocks/hazards
     */
    async fetchRoadAlerts(): Promise<RoadblockAlert[]> {
        const { data } = await api.get('/driver/road-alerts');
        return data.data;
    },

    /**
     * Submit a new roadblock warning
     */
    async reportRoadblock(payload: {
        description: string;
        type: string;
        lng: number;
        lat: number;
    }): Promise<any> {
        const { data } = await api.post('/driver/road-alerts', payload);
        return data.data;
    },

    /**
     * Register arrival at a delivery stop
     */
    async arriveAtStop(stopId: string): Promise<any> {
        const { data } = await api.post(`/driver/route/stops/${stopId}/arrive`);
        return data.data;
    },

    /**
     * Register starting delivery route navigation
     */
    async startDeliveryRoute(stopId: string, payload: {
        latitude: number | null;
        longitude: number | null;
    }): Promise<any> {
        const { data } = await api.post(`/driver/route/stops/${stopId}/start`, payload);
        return data.data;
    },

    /**
     * Fetch OSRM route geometry and directions from point A to B
     */
    async fetchOSRMRoute(
        start: [number, number],
        end: [number, number],
        alternatives = true
    ): Promise<CustomRoute[]> {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&alternatives=${alternatives}`
        );
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('Could not calculate OSRM route path');
        }

        return data.routes.map((r: any) => ({
            coordinates: r.geometry.coordinates,
            distance: r.distance,
            duration: r.duration,
        }));
    }
};
export default driverMapService;
