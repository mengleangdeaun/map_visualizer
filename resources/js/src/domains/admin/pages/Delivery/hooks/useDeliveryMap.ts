import { useState, useEffect } from 'react';

interface MapViewport {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
}

interface UseDeliveryMapOptions {
    stops: any[];
    activeStopIndex: number;
    setField: (name: string, value: any) => void;
}

interface UseDeliveryMapReturn {
    pinCoords: [number, number] | null;
    setPinCoords: React.Dispatch<React.SetStateAction<[number, number] | null>>;
    mapViewport: MapViewport;
    setMapViewport: React.Dispatch<React.SetStateAction<MapViewport>>;
    handleMapClick: (e: any) => void;
    handlePinDragEnd: (lngLat: { lng: number; lat: number }) => void;
}

const DEFAULT_VIEWPORT: MapViewport = {
    center: [104.9282, 11.5564], // Default: Phnom Penh
    zoom: 12,
    bearing: 0,
    pitch: 0,
};

/**
 * Map interaction hook for the delivery coordinate picker.
 * Manages pin coordinates, map viewport, click-to-pin, and drag-end handlers.
 * Automatically syncs the viewport when the active stop index changes.
 */
export function useDeliveryMap({
    stops,
    activeStopIndex,
    setField,
}: UseDeliveryMapOptions): UseDeliveryMapReturn {
    const [pinCoords, setPinCoords] = useState<[number, number] | null>(null);
    const [mapViewport, setMapViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);

    // Sync pin and viewport whenever the active stop changes
    useEffect(() => {
        const activeStop = stops?.[activeStopIndex];
        if (activeStop?.dropoff_longitude && activeStop?.dropoff_latitude) {
            const lng = Number(activeStop.dropoff_longitude);
            const lat = Number(activeStop.dropoff_latitude);
            setPinCoords([lng, lat]);
            setMapViewport((prev) => ({ ...prev, center: [lng, lat] }));
        } else {
            setPinCoords(null);
        }
    }, [activeStopIndex]);

    const handleMapClick = (e: any) => {
        const { lng, lat } = e.lngLat;
        setPinCoords([lng, lat]);

        const updated = [...(stops || [])];
        if (updated[activeStopIndex]) {
            updated[activeStopIndex] = {
                ...updated[activeStopIndex],
                dropoff_latitude: Number(lat.toFixed(6)),
                dropoff_longitude: Number(lng.toFixed(6)),
            };
            setField('stops', updated);
        }
    };

    const handlePinDragEnd = (lngLat: { lng: number; lat: number }) => {
        setPinCoords([lngLat.lng, lngLat.lat]);

        const updated = [...(stops || [])];
        if (updated[activeStopIndex]) {
            updated[activeStopIndex] = {
                ...updated[activeStopIndex],
                dropoff_latitude: Number(lngLat.lat.toFixed(6)),
                dropoff_longitude: Number(lngLat.lng.toFixed(6)),
            };
            setField('stops', updated);
        }
    };

    return {
        pinCoords,
        setPinCoords,
        mapViewport,
        setMapViewport,
        handleMapClick,
        handlePinDragEnd,
    };
}
