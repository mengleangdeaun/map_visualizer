import React from 'react';
import { MapMarker, MarkerContent, MarkerLabel } from '@/components/ui/map';
import { cn } from '@/lib/utils';

interface UserLocationMarkerProps {
    /** [longitude, latitude] coordinates */
    coordinates: [number, number] | null;
    /** Optional label text (defaults to 'YOU') */
    label?: string;
    /** Optional additional classes for the marker */
    className?: string;
}

export const UserLocationMarker = ({ coordinates, label = 'YOU', className }: UserLocationMarkerProps) => {
    if (!coordinates) return null;

    return (
        <MapMarker longitude={coordinates[0]} latitude={coordinates[1]}>
            <MarkerContent className={className}>
                <div className="relative group">
                    {/* Multi-layered sonar pulse effect */}
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-[2.5] duration-3000" />
                    <div className="absolute inset-0 bg-emerald-400/30 rounded-full animate-ping scale-150 duration-2000 delay-500" />
                    
                    {/* Glowing aura */}
                    <div className="absolute -inset-1 bg-emerald-500/20 blur-sm rounded-full" />
                    
                    {/* Main dot */}
                    <div className="relative size-5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center transition-transform group-hover:scale-110">
                        <div className="size-2 rounded-full bg-white shadow-inner animate-pulse" />
                    </div>
                </div>
                
                {label && (
                    <MarkerLabel 
                        position="bottom" 
                        className="mt-1 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        {label}
                    </MarkerLabel>
                )}
            </MarkerContent>
        </MapMarker>
    );
};
