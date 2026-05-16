import React from 'react';
import { MapMarker, MarkerContent, MarkerLabel } from '@/components/ui/map';
import { MapPin, Flag } from 'lucide-react';
import { PushPin, MapLabel } from './BaseMarker';

interface TaskMarkerProps {
    longitude: number;
    latitude: number;
    label?: string;
    onClick?: () => void;
    isFocused?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export const PickupMarker = ({ longitude, latitude, label, onClick, isFocused, className, children }: TaskMarkerProps) => (
    <MapMarker longitude={longitude} latitude={latitude} onClick={onClick}>
        <MarkerContent className={className}>
            <PushPin color="bg-emerald-500" isFocused={isFocused}>
                <MapPin className="size-4 text-white" strokeWidth={2.5} />
            </PushPin>
            {label && (
                <MarkerLabel position="top" className="mb-1">
                    <MapLabel type="pickup" isFocused={isFocused}>
                        {label}
                    </MapLabel>
                </MarkerLabel>
            )}
            {children}
        </MarkerContent>
    </MapMarker>
);

export const DropoffMarker = ({ longitude, latitude, label, onClick, isFocused, className, children }: TaskMarkerProps) => (
    <MapMarker longitude={longitude} latitude={latitude} onClick={onClick}>
        <MarkerContent className={className}>
            <PushPin color="bg-red-500" isFocused={isFocused}>
                <Flag className="size-4 text-white fill-white" strokeWidth={2.5} />
            </PushPin>
            {label && (
                <MarkerLabel position="top" className="mb-1">
                    <MapLabel type="dropoff" isFocused={isFocused}>
                        {label}
                    </MapLabel>
                </MarkerLabel>
            )}
            {children}
        </MarkerContent>
    </MapMarker>
);
