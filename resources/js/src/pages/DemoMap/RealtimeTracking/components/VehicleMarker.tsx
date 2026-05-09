"use client";

import React from 'react';
import { MapMarker, MarkerContent, MarkerLabel } from '@/components/ui/map';
import { Car, Navigation } from 'lucide-react';

interface VehicleMarkerProps {
    longitude: number;
    latitude: number;
    heading: number;
    speed: number;
    name?: string;
}

export const VehicleMarker = ({ 
    longitude, 
    latitude, 
    heading, 
    speed, 
    name = 'VEHICLE-01' 
}: VehicleMarkerProps) => {
    return (
        <MapMarker longitude={longitude} latitude={latitude}>
            <MarkerContent>
                <div className="relative group cursor-pointer">
                    {/* Heading Arrow */}
                    <div 
                        className="absolute -top-6 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-linear"
                        style={{ transform: `translateX(-50%) rotate(${heading}deg)` }}
                    >
                        <Navigation className="size-4 text-primary fill-primary animate-pulse" />
                    </div>

                    {/* Main Vehicle Icon */}
                    <div className="size-10 rounded-full bg-background border-4 border-primary shadow-2xl flex items-center justify-center text-primary transition-all group-hover:scale-110">
                        <Car className="size-6" />
                    </div>

                    {/* Speed Badge */}
                    <div className="absolute -right-2 -bottom-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-lg border border-primary-foreground/20">
                        {Math.round(speed)} <span className="opacity-70">KM/H</span>
                    </div>

                    {/* Label */}
                    <MarkerLabel position="top">
                        <div className="bg-primary text-white border-primary shadow-xl uppercase tracking-tighter text-[8px] px-2 py-0.5 rounded-full font-bold">
                            {name}
                        </div>
                    </MarkerLabel>
                </div>
            </MarkerContent>
        </MapMarker>
    );
};
