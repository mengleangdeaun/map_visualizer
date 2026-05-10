"use client";

import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { cn } from '@/lib/utils';

interface PulseMarkerProps {
    longitude: number;
    latitude: number;
    color?: string;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

export const PulseMarker = ({
    longitude,
    latitude,
    color = "#3b82f6",
    size = 'md',
    label
}: PulseMarkerProps) => {
    const sizeClasses = {
        sm: 'size-2',
        md: 'size-3',
        lg: 'size-4',
    };

    const pulseSizeClasses = {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-12',
    };

    return (
        <MapMarker longitude={longitude} latitude={latitude}>
            <MarkerContent>
                <div className="relative flex items-center justify-center">
                    {/* The Pulse Effect */}
                    <div 
                        className={cn("absolute rounded-full opacity-40 animate-ping", pulseSizeClasses[size])}
                        style={{ backgroundColor: color }}
                    />
                    <div 
                        className={cn("absolute rounded-full opacity-20 animate-pulse scale-150", pulseSizeClasses[size])}
                        style={{ backgroundColor: color }}
                    />
                    
                    {/* The Core Dot */}
                    <div 
                        className={cn("relative rounded-full border-2 border-white shadow-xl z-10", sizeClasses[size])}
                        style={{ backgroundColor: color }}
                    />

                    {label && (
                        <div className="absolute top-full mt-2 bg-background/80 backdrop-blur-md px-2 py-1 rounded border shadow-sm text-[10px] font-bold whitespace-nowrap">
                            {label}
                        </div>
                    )}
                </div>
            </MarkerContent>
        </MapMarker>
    );
};
