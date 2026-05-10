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
            <MarkerContent className={cn("z-50", className)}>
                <div className="relative group">
                    {/* Multi-layered sonar pulse effect */}
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-[2.5] duration-3000" />
                    <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping scale-150 duration-2000 delay-500" />
                    
                    {/* Glowing aura */}
                    <div className="absolute -inset-1 bg-primary/20 blur-sm rounded-full" />
                    
                    {/* Main dot */}
                    <div className="relative size-5 rounded-full bg-primary border-2 border-background shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <div className="size-2 rounded-full bg-primary-foreground shadow-inner animate-pulse" />
                    </div>
                </div>
                
                {label && (
                    <MarkerLabel 
                        position="top" 
                        className="mb-2 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest border shadow-xl backdrop-blur-md"
                    >
                        {label}
                    </MarkerLabel>
                )}
            </MarkerContent>
        </MapMarker>
    );
};
