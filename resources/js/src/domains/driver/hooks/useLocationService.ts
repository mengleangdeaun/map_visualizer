import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { toast } from 'sonner';
import { driverTaskService } from '../services/driverTaskService';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speed: number | null;
    error: string | null;
    isTracking: boolean;
}

export const useLocationService = () => {
    const { user } = useAuthStore();
    const [state, setState] = useState<LocationState>({
        latitude: null,
        longitude: null,
        heading: null,
        speed: null,
        error: null,
        isTracking: false,
    });

    const watchId = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const MIN_UPDATE_INTERVAL = 5000; // 5 seconds

    const updateServerLocation = useCallback(async (pos: GeolocationPosition) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < MIN_UPDATE_INTERVAL) return;

        try {
            await driverTaskService.reportLocation(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.speed || 0
            );
            
            lastUpdateRef.current = now;
        } catch (err) {
            console.error('Failed to update location on server', err);
        }
    }, []);

    const startTracking = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setState(s => ({ ...s, error: 'Geolocation not supported' }));
            return;
        }

        setState(s => ({ ...s, isTracking: true, error: null }));

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setState(s => ({
                    ...s,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                }));
                updateServerLocation(pos);
            },
            (err) => {
                setState(s => ({ ...s, error: err.message, isTracking: false }));
                toast.error(`Location error: ${err.message}`);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000,
            }
        );
    }, [updateServerLocation]);

    const stopTracking = useCallback(() => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        setState(s => ({ ...s, isTracking: false }));
    }, []);

    useEffect(() => {
        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, []);

    return {
        ...state,
        startTracking,
        stopTracking,
    };
};
