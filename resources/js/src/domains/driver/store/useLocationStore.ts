import { create } from 'zustand';

export interface LocationState {
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speed: number | null;
    error: string | null;
    isTracking: boolean;
    watchId: number | null;
    lastUpdate: number;
}

interface LocationStore extends LocationState {
    setTrackingState: (state: Partial<LocationState>) => void;
    resetTrackingState: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
    error: null,
    isTracking: false,
    watchId: null,
    lastUpdate: 0,
    setTrackingState: (state) => set((s) => ({ ...s, ...state })),
    resetTrackingState: () => set({
        latitude: null,
        longitude: null,
        heading: null,
        speed: null,
        error: null,
        isTracking: false,
        watchId: null,
        lastUpdate: 0,
    }),
}));
