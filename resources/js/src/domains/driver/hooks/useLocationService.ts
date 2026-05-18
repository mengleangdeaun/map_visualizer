import { useCallback } from 'react';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { pwaToast as toast } from '../store/usePwaToastStore';
import { driverTaskService } from '../services/driverTaskService';
import { useLocationStore } from '../store/useLocationStore';

const MIN_UPDATE_INTERVAL = 5000; // 5 seconds

export const useLocationService = () => {
    const { user } = useAuthStore();
    const state = useLocationStore();
    const { setTrackingState, watchId } = state;

    const updateServerLocation = useCallback(async (pos: GeolocationPosition, currentLastUpdate: number) => {
        const now = Date.now();
        if (now - currentLastUpdate < MIN_UPDATE_INTERVAL) return;

        try {
            await driverTaskService.reportLocation(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.speed || 0,
                pos.coords.heading
            );
            
            setTrackingState({ lastUpdate: now });
        } catch (err) {
            console.error('Failed to update location on server', err);
        }
    }, [setTrackingState]);

    const startTracking = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setTrackingState({ error: 'Geolocation not supported' });
            return;
        }

        // If a geolocation watcher is already active, don't spin up another duplicate watcher
        if (watchId !== null) {
            setTrackingState({ isTracking: true, error: null });
            return;
        }

        setTrackingState({ isTracking: true, error: null });

        const newWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                setTrackingState({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                });
                
                // Get the absolute freshest lastUpdate directly from the store to avoid stale closure updates
                const latestLastUpdate = useLocationStore.getState().lastUpdate;
                updateServerLocation(pos, latestLastUpdate);
            },
            (err) => {
                setTrackingState({ error: err.message, isTracking: false });
                toast.error(`Location error: ${err.message}`);
                
                // Clear the watcher if it has failed
                const activeWatchId = useLocationStore.getState().watchId;
                if (activeWatchId !== null) {
                    navigator.geolocation.clearWatch(activeWatchId);
                    setTrackingState({ watchId: null });
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000,
            }
        );

        setTrackingState({ watchId: newWatchId });
    }, [updateServerLocation, setTrackingState, watchId]);

    const stopTracking = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        setTrackingState({ isTracking: false, watchId: null });
    }, [setTrackingState, watchId]);

    return {
        ...state,
        startTracking,
        stopTracking,
    };
};
