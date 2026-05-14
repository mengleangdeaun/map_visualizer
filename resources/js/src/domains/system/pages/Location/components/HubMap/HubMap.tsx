import React, { useState, useEffect } from 'react';
import { Map, MapControls } from '@/components/ui/map';
import { Location } from '@/domains/fleet/services/locationService';
import { HubMarker } from '@/domains/system/pages/Location/components/HubMarker/HubMarker';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapLoading } from '@/components/shared/map/MapLoading';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { HubList } from '../HubList/HubList';

interface HubMapProps {
    locations: Location[];
    isLoading?: boolean;
    isFetching?: boolean;
    onEdit?: (location: Location) => void;
    onDelete?: (location: Location) => void;
}

export const HubMap = ({ 
    locations, 
    isLoading, 
    isFetching,
    onEdit, 
    onDelete 
}: HubMapProps) => {
    const [viewport, setViewport] = useState({
        center: [104.9282, 11.5564] as [number, number], // Default to Phnom Penh
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Center map on first location if available
    useEffect(() => {
        if (locations.length > 0) {
            const first = locations.find(l => l.latitude && l.longitude);
            if (first) {
                setViewport(prev => ({
                    ...prev,
                    center: [Number(first.longitude), Number(first.latitude)],
                    zoom: 11
                }));
            }
        }
    }, [locations.length === 0]); 

    const handleSelectLocation = (location: Location) => {
        setSelectedId(location.id);
        if (location.latitude && location.longitude) {
            setViewport({
                ...viewport,
                center: [Number(location.longitude), Number(location.latitude)],
                zoom: 14,
            });
        }
    };

    if (isLoading) {
        return (
            <Card className="h-[600px] w-full relative overflow-hidden rounded-xl border bg-muted/5 flex items-center justify-center">
                <MapLoading message="Loading Hubs..." />
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[650px]">
            <Card className="lg:col-span-3 relative overflow-hidden rounded-xl p-0 shadow-sm h-full">
                {isFetching && <MapLoading message="Updating hubs..." />}
                <Map 
                    viewport={viewport} 
                    onViewportChange={setViewport}
                    className="h-full w-full"
                    language="km"
                >
                    <MapControls 
                        position="top-right" 
                        showLocate 
                        showCompass
                        onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])}
                    />

                    <UserLocationMarker coordinates={userLocation} />

                    {locations.map((location) => (
                        <HubMarker 
                            key={location.id} 
                            location={location}
                            isSelected={selectedId === location.id}
                            onClick={() => setSelectedId(location.id)}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </Map>
            </Card>

            <div className="lg:col-span-1 h-full min-h-0 bg-card border rounded-xl shadow-sm overflow-hidden">
                <HubList 
                    locations={locations} 
                    selectedId={selectedId} 
                    onSelect={handleSelectLocation}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};
