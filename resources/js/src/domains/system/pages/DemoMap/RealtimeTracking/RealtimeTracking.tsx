'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Map, MapControls, MapMarker, MapRoute, MarkerContent, MarkerLabel } from '@/components/ui/map';
import { echo } from '@/lib/echo';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { VehicleMarker } from './components/VehicleMarker';
import { Wifi, WifiOff, Car, ShieldCheck, Target, MousePointer2, MapPin, Clock, Gauge, Navigation, Star, Phone, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapSearch } from '@/components/shared/map/MapSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TelemetryCard } from './components/TelemetryCard';
import { DriverCard } from '@/components/shared/map/DriverCard';
import { MapLoading } from '@/components/shared/map/MapLoading';

interface TelemetryData {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    timestamp: string;
}

const RealtimeTracking = () => {
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [history, setHistory] = useState<[number, number][]>([]);
    const [isFollowing, setIsFollowing] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const mapRef = useRef<any>(null);

    const googleKhmerStyle = useMemo<any>(() => {
        return {
            light: {
                version: 8,
                sources: {
                    'google-tiles': {
                        type: 'raster',
                        tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=km'],
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
                    },
                ],
            },
            dark: {
                version: 8,
                sources: {
                    'google-tiles': {
                        type: 'raster',
                        tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=km'],
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
        } as const;
    }, []);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.longitude, pos.coords.latitude]);
                },
                (error) => {
                    console.warn('Geolocation initial check failed:', error.message);
                },
            );
        }
    }, []);

    useEffect(() => {
        const channel = echo.channel('telemetry.123');

        const updateTelemetry = (eventData: any) => {
            const data = eventData.telemetry || eventData;

            if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
                return;
            }

            const mappedData: TelemetryData = {
                latitude: data.latitude,
                longitude: data.longitude,
                heading: data.heading ?? 0,
                speed: data.speed ?? 0,
                timestamp: data.timestamp ?? new Date().toISOString(),
            };

            setTelemetry(mappedData);
            setHistory((prev) => {
                const newPoint: [number, number] = [mappedData.longitude, mappedData.latitude];
                if (prev.length > 0) {
                    const lastPoint = prev[prev.length - 1];
                    if (lastPoint[0] === newPoint[0] && lastPoint[1] === newPoint[1]) {
                        return prev;
                    }
                }
                return [...prev.slice(-200), newPoint];
            });
            setIsConnected(true);

            if (mapRef.current && isFollowing) {
                mapRef.current.easeTo({
                    center: [mappedData.longitude, mappedData.latitude],
                    bearing: mappedData.heading,
                    pitch: 45,
                    duration: 1000,
                });
            }
        };

        channel.on('VehicleUpdated', updateTelemetry);
        channel.on('.vehicle.location.updated', updateTelemetry);
        channel.on('vehicle.location.updated', updateTelemetry);
        channel.on('VehicleLocationUpdated', updateTelemetry);
        channel.on('.VehicleLocationUpdated', updateTelemetry);

        echo.connector.pusher.connection.bind('state_change', (states: any) => {
            setIsConnected(states.current === 'connected');
        });

        return () => {
            echo.leaveChannel('telemetry.123');
        };
    }, [isFollowing]);

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <PageHeader title="Real-time Delivery Tracking" subtitle="Live vehicle telemetry via Laravel Reverb & MapLibre GL." />
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant={isFollowing ? 'default' : 'outline'} size="default" className="h-10 px-4" onClick={() => setIsFollowing(!isFollowing)}>
                                        {isFollowing ? <Target className="size-4 mr-2" /> : <MousePointer2 className="size-4 mr-2" />}
                                        {isFollowing ? 'Following' : 'Free Move'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isFollowing ? 'Disable auto-follow' : 'Enable auto-follow'}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="default"
                                        className="h-10 px-4"
                                        onClick={() => {
                                            if (telemetry && mapRef.current) {
                                                mapRef.current.flyTo({
                                                    center: [telemetry.longitude, telemetry.latitude],
                                                    zoom: 16,
                                                    duration: 2000,
                                                });
                                                setIsFollowing(true);
                                            }
                                        }}
                                    >
                                        <Car className="size-4 mr-2" />
                                        Fly to Driver
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Center map on vehicle</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 h-full rounded-2xl border bg-card overflow-hidden relative group">
                    <Map ref={mapRef} className="h-full w-full" center={[104.8836, 11.5641]} zoom={14} styles={googleKhmerStyle} language="km">
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
                            <MapSearch
                                onSelect={(result) => {
                                    if (mapRef.current) {
                                        mapRef.current.flyTo({
                                            center: result.coordinates,
                                            zoom: 16,
                                            duration: 1500,
                                        });
                                        setIsFollowing(false);
                                    }
                                }}
                                className="w-full shadow-2xl"
                            />
                        </div>

                        <MapControls
                            showCompass
                            showFullscreen
                            showLocate
                            showZoom
                            position="top-right"
                            onLocate={(coords) => {
                                const location: [number, number] = [coords.longitude, coords.latitude];
                                setUserLocation(location);
                            }}
                        />

                        {history.length > 1 && (
                            <>
                                {/* Shadow/Outer Route */}
                                <MapRoute id="vehicle-trail-outer" coordinates={history} color="#10b981" width={8} opacity={0.2} blur={8} />
                                {/* Inner Animated Route */}
                                <MapRoute id="vehicle-trail" coordinates={history} color="#10b981" width={4} opacity={1} animate />
                            </>
                        )}

                        {telemetry && <VehicleMarker longitude={telemetry.longitude} latitude={telemetry.latitude} heading={telemetry.heading} speed={telemetry.speed} />}

                        <UserLocationMarker coordinates={userLocation} label="YOUR LOCATION" />
                    </Map>

                    {telemetry && (
                        <DriverCard
                            className="absolute bottom-6 left-6 z-40 animate-in slide-in-from-bottom-10 duration-500"
                            driver={{
                                name: 'Sok Sombo',
                                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sombo',
                                rating: 4.9,
                                vehicle: 'Toyota Prius',
                                plate: '2AA-9999',
                            }}
                            status={isConnected ? 'Stable' : 'Connecting'}
                            onFocus={() => {
                                if (telemetry && mapRef.current) {
                                    mapRef.current.flyTo({ center: [telemetry.longitude, telemetry.latitude], zoom: 17, duration: 1500 });
                                    setIsFollowing(true);
                                }
                            }}
                        />
                    )}

                    {!isConnected && <MapLoading message="Signal Lost. Re-establishing link..." />}
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-full">
                    <TelemetryCard data={telemetry} isConnected={isConnected} historyLength={history.length} />
                </div>
            </div>
        </div>
    );
};

export default RealtimeTracking;
