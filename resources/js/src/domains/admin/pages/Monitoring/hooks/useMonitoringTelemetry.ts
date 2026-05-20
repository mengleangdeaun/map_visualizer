import { useState, useEffect, useMemo } from 'react';
import { Location } from '@/domains/fleet/services/locationService';
import { Vehicle } from '@/domains/admin/services/vehicleService';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { echo } from '@/lib/echo';

interface UseMonitoringTelemetryProps {
    vehicles: Vehicle[];
    locations: Location[];
    focusTarget?: { id: string; type: string; center: [number, number] } | null;
    setViewport: React.Dispatch<React.SetStateAction<{
        center: [number, number];
        zoom: number;
        bearing: number;
        pitch: number;
    }>>;
}

export const useMonitoringTelemetry = ({
    vehicles,
    locations,
    focusTarget,
    setViewport
}: UseMonitoringTelemetryProps) => {
    const { user } = useAuthStore();
    const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Google Khmer Style
    const googleKhmerStyle = useMemo<any>(() => {
        const tiles = ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=km'];
        return {
            light: {
                version: 8,
                sources: {
                    'google-tiles': {
                        type: 'raster',
                        tiles,
                        tileSize: 256,
                        attribution: '&copy; Google',
                    },
                },
                layers: [{ id: 'google-tiles', type: 'raster', source: 'google-tiles', minzoom: 0, maxzoom: 22 }],
            },
            dark: {
                version: 8,
                sources: {
                    'google-tiles': {
                        type: 'raster',
                        tiles,
                        tileSize: 256,
                        attribution: '&copy; Google',
                    },
                },
                layers: [
                    {
                        id: 'google-tiles',
                        type: 'raster',
                        source: 'google-tiles',
                        minzoom: 0,
                        maxzoom: 22,
                        paint: {
                            'raster-brightness-max': 0.6,
                            'raster-brightness-min': 0,
                            'raster-contrast': 0.2,
                            'raster-hue-rotate': 180,
                            'raster-saturation': -0.8,
                        },
                    },
                ],
            },
        };
    }, []);

    // 1. Synchronize props to live state
    useEffect(() => {
        setLiveVehicles(vehicles);
    }, [vehicles]);

    // 2. Listen for real-time location updates
    useEffect(() => {
        if (!echo || !user) return;

        const companyId = user.company_id;
        const channelName = companyId ? `fleet.${companyId}` : 'telemetry.public';
        const channel = companyId ? echo.private(channelName) : echo.channel(channelName);

        console.log(`MonitoringMap: Subscribing to ${companyId ? 'PRIVATE' : 'PUBLIC'} channel:`, channelName);

        channel.listen('.vehicle.location.updated', (event: any) => {
            setLiveVehicles((prev) => {
                const exists = prev.find(v => v.id === event.vehicle_id);
                if (exists) {
                    return prev.map((v) => 
                        v.id === event.vehicle_id 
                            ? { ...v, latitude: event.latitude, longitude: event.longitude, heading: event.heading, speed: event.speed } 
                            : v
                    );
                }
                
                const newVehicle: any = {
                    id: event.vehicle_id,
                    plate_number: event.vehicle_id.includes('SIM') ? event.vehicle_id : 'NEW-UNIT',
                    latitude: event.latitude,
                    longitude: event.longitude,
                    heading: event.heading,
                    speed: event.speed,
                    type: 'motorcycle',
                    is_active: true
                };
                return [...prev, newVehicle];
            });
        });

        return () => {
            echo.leave(channelName);
        };
    }, [user?.company_id]);

    // Only auto-center on the very first load if nothing is focused
    useEffect(() => {
        if (focusTarget) return;
        
        if (liveVehicles.length > 0) {
            const first = liveVehicles.find(v => v.latitude && v.longitude);
            if (first) {
                setViewport(prev => ({
                    ...prev,
                    center: [Number(first.longitude), Number(first.latitude)],
                    zoom: 12
                }));
            }
        } else if (locations.length > 0) {
            const first = locations.find(l => l.latitude && l.longitude);
            if (first) {
                setViewport(prev => ({
                    ...prev,
                    center: [Number(first.longitude), Number(first.latitude)],
                    zoom: 11
                }));
            }
        }
    }, [liveVehicles.length === 0 && locations.length === 0]);

    const activeVehiclesCount = useMemo(() => liveVehicles.filter(v => v.is_active).length, [liveVehicles]);

    return {
        liveVehicles,
        googleKhmerStyle,
        userLocation,
        setUserLocation,
        activeVehiclesCount
    };
};
