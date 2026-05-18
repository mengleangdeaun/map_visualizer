import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { pwaToast as toast } from '../store/usePwaToastStore';
import { driverTaskService } from '../services/driverTaskService';
import { useLocationStore } from '../store/useLocationStore';

export const useLocationService = () => {
    const { user } = useAuthStore();
    const state = useLocationStore();
    const { setTrackingState } = state;

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
            setTrackingState({ error: 'Geolocation not supported' });
            return;
        }

        setTrackingState({ isTracking: true, error: null });

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setTrackingState({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                });
                updateServerLocation(pos);
            },
            (err) => {
                setTrackingState({ error: err.message, isTracking: false });
                toast.error(`Location error: ${err.message}`);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000,
            }
        );
    }, [updateServerLocation, setTrackingState]);

    const stopTracking = useCallback(() => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        setTrackingState({ isTracking: false });
    }, [setTrackingState]);

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
