import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '../store/useLocationStore';
import { telemetryService } from '../services/telemetryService';
import type {
    LivePosition,
    ShiftStats,
    GpsAccuracy,
    CompassDirection,
} from '../types/telemetry.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert GPS accuracy in metres to a human-readable tier.
 */
export function classifyAccuracy(accuracyMetres: number | null | undefined): GpsAccuracy {
    if (accuracyMetres == null) return 'unknown';
    if (accuracyMetres <= 5) return 'excellent';
    if (accuracyMetres <= 15) return 'good';
    if (accuracyMetres <= 50) return 'fair';
    return 'poor';
}

/**
 * Convert heading in degrees (0–360) to a cardinal compass direction.
 */
export function headingToCompass(heading: number | null): CompassDirection {
    if (heading == null) return '—';
    const dirs: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(heading / 45) % 8];
}

/**
 * Format a duration in seconds as HH:MM:SS.
 */
export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseTelemetryReturn {
    /** Live GPS state derived from the geolocation watcher */
    live: LivePosition | null;
    /** Whether the driver is currently broadcasting location */
    isTracking: boolean;
    /** GPS accuracy classification */
    accuracy: GpsAccuracy;
    /** Cardinal direction derived from heading */
    compass: CompassDirection;
    /** Aggregated stats for the current shift from the server */
    stats: ShiftStats | null;
    /** True while the stats are being loaded for the first time */
    isLoadingStats: boolean;
    /** Error string if telemetry tracking is in error state */
    trackingError: string | null;
}

/**
 * Central telemetry hook that combines:
 *  - Live GPS data from the Zustand location store (updated by useLocationService)
 *  - Server-side shift stats polled every 30 s from /driver/telemetry/stats
 */
export const useTelemetry = (): UseTelemetryReturn => {
    const {
        latitude,
        longitude,
        heading,
        speed,
        isTracking,
        error: trackingError,
    } = useLocationStore();

    // Derive a typed LivePosition object
    const live = useMemo<LivePosition | null>(() => {
        if (latitude == null || longitude == null) return null;
        return {
            latitude,
            longitude,
            heading,
            speedMs: speed,
            speedKmh: speed != null ? Math.round(speed * 3.6) : 0,
            accuracy: null, // accuracy is not stored in LocationStore yet
            timestamp: Date.now(),
        };
    }, [latitude, longitude, heading, speed]);

    const accuracy = useMemo(() => classifyAccuracy(live?.accuracy), [live]);
    const compass = useMemo(() => headingToCompass(live?.heading ?? null), [live]);

    // Poll shift stats from server every 30 s when tracking is active
    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['driver', 'telemetry', 'stats'],
        queryFn: telemetryService.getStats,
        refetchInterval: isTracking ? 30_000 : false,
        enabled: isTracking,
        staleTime: 25_000,
    });

    return {
        live,
        isTracking,
        accuracy,
        compass,
        stats: statsData?.stats ?? null,
        isLoadingStats,
        trackingError,
    };
};
