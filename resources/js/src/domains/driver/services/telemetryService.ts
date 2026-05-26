import api from '@/lib/api';
import type { TelemetryStatsResponse } from '../types/telemetry.types';

export const telemetryService = {
    /**
     * Fetch aggregated telemetry statistics for the driver's current shift.
     * The backend reads from the Cache (hot) and DriverTelemetry table.
     */
    getStats: async (): Promise<TelemetryStatsResponse> => {
        const { data } = await api.get<any>('/driver/telemetry/stats');

        // Laravel returns snake_case — map to our camelCase TypeScript types here.
        if (!data.active || !data.stats) {
            return { active: false, stats: null };
        }

        const s = data.stats;
        return {
            active: true,
            stats: {
                distanceKm:      Number(s.distance_km      ?? 0),
                durationSeconds: Number(s.duration_seconds ?? 0),
                pointsRecorded:  Number(s.points_recorded  ?? 0),
                avgSpeedKmh:     Number(s.avg_speed_kmh    ?? 0),
                maxSpeedKmh:     Number(s.max_speed_kmh    ?? 0),
                lastPersistedAt: s.last_persisted_at ?? null,
            },
        };
    },

    /**
     * Report the driver's current GPS position to the server.
     * Matches the existing PATCH /driver/location endpoint.
     */
    reportLocation: async (
        latitude: number,
        longitude: number,
        speed?: number,
        heading?: number | null
    ): Promise<void> => {
        await api.patch('/driver/location', { latitude, longitude, speed, heading });
    },
};
