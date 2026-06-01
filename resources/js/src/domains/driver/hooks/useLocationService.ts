import { useCallback } from 'react';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { pwaToast as toast } from '../store/usePwaToastStore';
import { driverTaskService } from '../services/driverTaskService';
import { useLocationStore } from '../store/useLocationStore';

const MIN_UPDATE_INTERVAL = 5000; // 5 seconds
let lastOrientationUpdate = 0;
const ORIENTATION_THROTTLE = 200; // Throttle to 200ms to reduce CPU overhead

// Global stable listener reference to prevent stale state closures and memory leaks
const handleDeviceOrientation = (event: any) => {
    const now = Date.now();
    if (now - lastOrientationUpdate < ORIENTATION_THROTTLE) return;

    let heading: number | null = null;

    // 1. iOS proprietary Compass Heading (absolute orientation)
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        heading = event.webkitCompassHeading;
    }
    // 2. Android deviceorientationabsolute absolute alpha
    else if (event.absolute === true && event.alpha !== undefined && event.alpha !== null) {
        heading = 360 - event.alpha;
    }
    // 3. Standard fallback alpha orientation
    else if (event.alpha !== undefined && event.alpha !== null) {
        heading = 360 - event.alpha;
    }

    if (heading !== null && !isNaN(heading)) {
        // Keep heading degree within the canonical [0, 360) range
        heading = (heading + 360) % 360;
        useLocationStore.getState().setTrackingState({ heading });
        lastOrientationUpdate = now;
    }
};

export const useLocationService = () => {
    const { user } = useAuthStore();
    const state = useLocationStore();
    const { setTrackingState, watchId, resetTrackingState } = state;

    const updateServerLocation = useCallback(async (pos: GeolocationPosition, currentLastUpdate: number) => {
        const now = Date.now();
        if (now - currentLastUpdate < MIN_UPDATE_INTERVAL) return;

        try {
            // Read high-accuracy compass heading from store, falling back to Geolocation heading if null
            const currentHeading = useLocationStore.getState().heading;
            await driverTaskService.reportLocation(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.speed || 0,
                currentHeading ?? pos.coords.heading
            );
            
            setTrackingState({ lastUpdate: now });
        } catch (err) {
            console.error('Failed to update location on server', err);
        }
    }, [setTrackingState]);

    // iOS Webkit Motion & Orientation Permission Requester
    const requestCompassPermission = useCallback(async (): Promise<boolean> => {
        const DeviceOrientationEventAny = window.DeviceOrientationEvent as any;
        if (
            typeof window !== 'undefined' &&
            DeviceOrientationEventAny &&
            typeof DeviceOrientationEventAny.requestPermission === 'function'
        ) {
            try {
                const permissionState = await DeviceOrientationEventAny.requestPermission();
                return permissionState === 'granted';
            } catch (error) {
                console.error('Failed to request device orientation permission:', error);
                return false;
            }
        }
        // Non-iOS or older platforms do not require permission prompts
        return true;
    }, []);

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

        // Register hardware device orientation listeners
        if (typeof window !== 'undefined') {
            const win = window as any;
            if ('ondeviceorientationabsolute' in win) {
                win.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
            } else if ('ondeviceorientation' in win) {
                win.addEventListener('deviceorientation', handleDeviceOrientation, true);
            }
        }

        const newWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                const currentCompassHeading = useLocationStore.getState().heading;
                setTrackingState({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    heading: currentCompassHeading ?? pos.coords.heading,
                    speed: pos.coords.speed,
                    accuracy: pos.coords.accuracy,
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

                // Deregister hardware listeners upon tracking failure
                if (typeof window !== 'undefined') {
                    window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
                    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
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
        const activeWatchId = useLocationStore.getState().watchId;
        if (activeWatchId !== null) {
            navigator.geolocation.clearWatch(activeWatchId);
        }

        // Deregister hardware listeners upon tracking stop
        if (typeof window !== 'undefined') {
            window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
            window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
        }

        resetTrackingState();
    }, [resetTrackingState]);

    return {
        ...state,
        startTracking,
        stopTracking,
        requestCompassPermission,
    };
};
