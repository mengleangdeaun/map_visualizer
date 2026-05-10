"use client";

import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';

interface VehicleMarkerProps {
    longitude: number;
    latitude: number;
    heading: number;
    speed: number;
    name?: string;
    eta?: number; // Optional ETA in seconds
}

/**
 * Formats seconds into a human-readable duration (e.g., "12 min")
 */
const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.ceil(seconds / 60);
    return `${mins} min`;
};

export const VehicleMarker = ({ 
    longitude, 
    latitude, 
    heading, 
    speed, 
    name = 'VEHICLE-01',
    eta = 0
}: VehicleMarkerProps) => {
    return (
        <MapMarker 
            longitude={longitude} 
            latitude={latitude}
            rotation={heading}
            rotationAlignment="map"
        >
            <MarkerContent>
                <div className="relative group cursor-pointer flex flex-col items-center">
                    {/* The Pulse/Signal Effect */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute size-10 bg-primary/20 rounded-full animate-ping" />
                        <div className="absolute size-14 bg-primary/10 rounded-full animate-pulse" />
                    </div>

                    {/* The Car Asset */}
                    <div className="relative transition-transform group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] z-10">
                        <img 
                            src="/assets/images/map/car.svg" 
                            alt="Car" 
                            className="w-8 h-auto"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                        />
                    </div>

                    {/* Speed/ETA Tooltip */}
                    {speed > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                                {Math.round(speed)} KM/H
                            </div>
                        </div>
                    )}

                    {eta > 0 && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                            {formatDuration(eta)}
                        </div>
                    )}
                </div>
            </MarkerContent>
        </MapMarker>
    );
};
