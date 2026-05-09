"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
    Map, 
    MapControls, 
    MapMarker, 
    MapRoute, 
    MarkerContent,
    MarkerLabel
} from '@/components/ui/map';
import { echo } from '@/lib/echo';
import { PageHeader } from '@/components/shared/PageHeader';
import { TelemetryCard } from './components/TelemetryCard';
import { VehicleMarker } from './components/VehicleMarker';
import { Wifi, WifiOff, Car, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    const mapRef = useRef<any>(null);

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
                timestamp: data.timestamp ?? new Date().toISOString()
            };

            setTelemetry(mappedData);
            setHistory(prev => {
                const newPoint: [number, number] = [mappedData.longitude, mappedData.latitude];
                // Avoid adding duplicate points if the vehicle hasn't moved
                if (prev.length > 0) {
                    const lastPoint = prev[prev.length - 1];
                    if (lastPoint[0] === newPoint[0] && lastPoint[1] === newPoint[1]) {
                        return prev;
                    }
                }
                return [...prev.slice(-200), newPoint];
            });
            setIsConnected(true);
            
            if (mapRef.current) {
                mapRef.current.easeTo({
                    center: [mappedData.longitude, mappedData.latitude],
                    duration: 1000
                });
            }
        };

        channel.on('VehicleUpdated', updateTelemetry);
        channel.on('.vehicle.location.updated', updateTelemetry);

        echo.connector.pusher.connection.bind('state_change', (states: any) => {
            setIsConnected(states.current === 'connected');
        });

        return () => {
            echo.leaveChannel('telemetry.123');
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <PageHeader 
                    title="Real-time Delivery Tracking" 
                    subtitle="Live vehicle telemetry via Laravel Reverb & MapLibre GL."
                />
                <div className="flex items-center gap-3">
                    <Badge variant={isConnected ? "default" : "destructive"} className="gap-1.5 px-3 py-1">
                        {isConnected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                        {isConnected ? 'LIVE' : 'DISCONNECTED'}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                        <ShieldCheck className="size-3 text-emerald-500" />
                        SECURE
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 h-full rounded-2xl border bg-card shadow-2xl overflow-hidden relative group">
                    <Map 
                        ref={mapRef}
                        className="h-full w-full"
                        center={[104.8836, 11.5641]}
                        zoom={14}
                    >
                        <MapControls />
                        
                        {history.length > 1 && (
                            <MapRoute
                                id="vehicle-trail"
                                coordinates={history}
                                color="#10b981" // Emerald primary hex
                                width={6}
                                opacity={0.6}
                            />
                        )}

                        {telemetry && (
                            <VehicleMarker 
                                longitude={telemetry.longitude}
                                latitude={telemetry.latitude}
                                heading={telemetry.heading}
                                speed={telemetry.speed}
                            />
                        )}
                    </Map>

                    {!isConnected && (
                        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] flex items-center justify-center z-50">
                            <div className="bg-background/90 p-6 rounded-2xl border shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <div className="size-12 rounded-full bg-muted animate-pulse flex items-center justify-center">
                                    <WifiOff className="size-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold">Reconnecting...</h3>
                                    <p className="text-xs text-muted-foreground">Waiting for telemetry signal</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-4 overflow-y-auto">
                    {telemetry ? (
                        <TelemetryCard data={telemetry} />
                    ) : (
                        <Card className="h-full flex items-center justify-center border-dashed">
                            <div className="text-center p-8">
                                <Car className="size-12 text-muted/20 mx-auto mb-4" />
                                <p className="text-sm font-medium text-muted-foreground">No active vehicle signal</p>
                            </div>
                        </Card>
                    )}
                    
                    {/* Debug Info */}
                    <div className="p-4 bg-muted/20 rounded-xl border text-[10px] text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Points in history:</span>
                            <span className="font-mono">{history.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Card = ({ children, className }: any) => (
    <div className={`bg-card text-card-foreground rounded-xl border shadow-sm ${className}`}>
        {children}
    </div>
);

export default RealtimeTracking;
