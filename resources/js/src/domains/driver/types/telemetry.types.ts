/**
 * Driver Telemetry Types
 * Covers live GPS state and aggregated shift statistics.
 */

/** Live GPS coordinates emitted by the Geolocation API */
export interface LivePosition {
    latitude: number;
    longitude: number;
    /** Direction of travel in degrees (0–360, true north = 0) */
    heading: number | null;
    /** Speed in m/s as provided by the Geolocation API */
    speedMs: number | null;
    /** Speed in km/h (derived from speedMs) */
    speedKmh: number;
    /** Accuracy of the position in metres */
    accuracy?: number | null;
    /** Timestamp of the reading (ms since epoch) */
    timestamp: number;
}

/** GPS accuracy tier */
export type GpsAccuracy = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

/** Aggregated statistics for the driver's current shift */
export interface ShiftStats {
    /** Total distance driven during the active shift (km) */
    distanceKm: number;
    /** Duration of the current shift in seconds */
    durationSeconds: number;
    /** Number of telemetry data points persisted for the shift */
    pointsRecorded: number;
    /** Average speed (km/h) during the shift */
    avgSpeedKmh: number;
    /** Top speed recorded (km/h) during the shift */
    maxSpeedKmh: number;
    /** Timestamp of the last server-persisted update */
    lastPersistedAt: string | null;
}

/** Response from the backend `/driver/telemetry/stats` endpoint */
export interface TelemetryStatsResponse {
    active: boolean;
    stats: ShiftStats | null;
}

/** Direction cardinal name derived from heading degrees */
export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | '—';
