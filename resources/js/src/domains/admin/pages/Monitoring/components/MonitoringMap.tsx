import React, { useState, useEffect, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel } from '@/components/ui/map';
import { RoadRoute } from '@/components/shared/map/RoadRoute';
import { Location } from '@/domains/fleet/services/locationService';
import { Vehicle } from '@/domains/admin/services/vehicleService';
import { HubMarker } from '@/domains/system/pages/Location/components/HubMarker/HubMarker';
import { VehicleMarker } from './VehicleMarker';
import { Card } from '@/components/ui/card';
import { MapLoading } from '@/components/shared/map/MapLoading';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin, Activity, ShieldAlert, ClipboardList, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { echo } from '@/lib/echo';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';

import { Task } from '@/domains/admin/pages/Tasks/services/taskService';
import { MonitoringStats } from './MonitoringStats';
import { MapSearch, SearchResult } from '@/components/shared/map/MapSearch';
import { PickupMarker, DropoffMarker } from '@/components/shared/map/TaskMarkers';
import { Button } from '@/components/ui/button';

interface MonitoringMapProps {
    locations: Location[];
    vehicles: Vehicle[];
    tasks: Task[];
    isLoading?: boolean;
    isFetching?: boolean;
    focusTarget?: { id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] } | null;
    onClick?: (e: any) => void;
    pendingPickup?: { lat: number, lng: number } | null;
    pendingDropoff?: { lat: number, lng: number } | null;
    onCreateTask?: () => void;
}

export const MonitoringMap = React.memo(({ 
    locations, 
    vehicles, 
    tasks,
    isLoading, 
    isFetching,
    focusTarget,
    onClick,
    pendingPickup,
    pendingDropoff,
    onCreateTask
}: MonitoringMapProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const { user } = useAuthStore();
    const mapRef = React.useRef<any>(null);
    const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
    
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

    const [viewport, setViewport] = useState({
        center: [104.9282, 11.5564] as [number, number], // Default to Phnom Penh
        zoom: 12,
        bearing: 0,
        pitch: 45,
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'hub' | 'vehicle' | 'task' | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [showHubs, setShowHubs] = useState(false);

    // Handle focus target
    useEffect(() => {
        if (focusTarget && mapRef.current) {
            mapRef.current.flyTo({
                center: focusTarget.center,
                zoom: focusTarget.type === 'vehicle' ? 15 : 13,
                speed: 1.2,
                curve: 1.42,
                essential: true
            });
            setSelectedId(focusTarget.id);
            setSelectedType(focusTarget.type as any);
        }
    }, [focusTarget]);

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

    if (isLoading && vehicles.length === 0 && locations.length === 0) {
        return (
            <Card className="h-full w-full relative overflow-hidden rounded-xl border bg-muted/5 flex items-center justify-center">
                <MapLoading message={t('admin:loading_monitoring_data') || "Loading Monitoring Data..."} />
            </Card>
        );
    }

    return (
        <div className="relative h-full w-full group/map">
            {isFetching && <MapLoading message={t('admin:updating_realtime') || "Updating real-time data..."} />}
            
            <Map 
                ref={mapRef}
                viewport={viewport} 
                onViewportChange={setViewport}
                onClick={onClick}
                className="h-full w-full"
                language="km"
                styles={googleKhmerStyle}
            >
                <MapControls 
                    position="top-right" 
                    showZoom 
                    showCompass 
                    showLocate
                    onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])}
                />

                <UserLocationMarker coordinates={userLocation} />

                {pendingPickup && (
                    <PickupMarker 
                        longitude={pendingPickup.lng} 
                        latitude={pendingPickup.lat}
                        label={t('admin:new_pickup') || "New Pickup"}
                        className="animate-in zoom-in duration-300"
                    />
                )}

                {pendingDropoff && (
                    <DropoffMarker 
                        longitude={pendingDropoff.lng} 
                        latitude={pendingDropoff.lat}
                        label={t('admin:new_destination') || "New Destination"}
                        className="animate-in zoom-in duration-300"
                    >
                        {pendingPickup && (
                             <MarkerLabel position="top" className="mb-10 pointer-events-auto">
                                <Button 
                                    size="sm" 
                                    className="rounded-full py-4 px-3 shadow-2xl bg-primary hover:bg-primary/90 text-white font-bold animate-in zoom-in slide-in-from-bottom-2 duration-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateTask?.();
                                    }}
                                >
                                    <Plus className="mr-1.5 size-3.5" strokeWidth={3} />
                                    {t('admin:create_task_now') || 'Create Task Now'}
                                </Button>
                            </MarkerLabel>
                        )}
                    </DropoffMarker>
                )}

                {/* Render Hubs */}
                {showHubs && locations.map((location) => (
                    <HubMarker 
                        key={location.id} 
                        location={location}
                        isSelected={selectedType === 'hub' && selectedId === location.id}
                        onClick={() => {
                            setSelectedId(location.id);
                            setSelectedType('hub');
                        }}
                    />
                ))}

                {/* Render Vehicles */}
                {liveVehicles.map((vehicle) => (
                    <VehicleMarker 
                        key={vehicle.id} 
                        vehicle={vehicle}
                        isSelected={selectedType === 'vehicle' && selectedId === vehicle.id}
                        onClick={() => {
                            setSelectedId(vehicle.id);
                            setSelectedType('vehicle');
                        }}
                    />
                ))}

                {/* Render Tasks */}
                {tasks.map((task) => {
                    const isFocused = selectedType === 'task' && selectedId === task.id;
                    
                    return (
                        <React.Fragment key={task.id}>
                            {task.pickup_lat && task.pickup_lng && (
                                <PickupMarker 
                                    longitude={task.pickup_lng} 
                                    latitude={task.pickup_lat}
                                    isFocused={isFocused}
                                    label={`P: ${task.title.substring(0, 10)}`}
                                    onClick={() => {
                                        setSelectedId(task.id);
                                        setSelectedType('task');
                                    }}
                                />
                            )}

                            {task.dropoff_lat && task.dropoff_lng && (
                                <DropoffMarker 
                                    longitude={task.dropoff_lng} 
                                    latitude={task.dropoff_lat}
                                    isFocused={isFocused}
                                    label={`D: ${task.contact_name || 'DEST'}`}
                                    onClick={() => {
                                        setSelectedId(task.id);
                                        setSelectedType('task');
                                    }}
                                />
                            )}

                            {/* Route Line */}
                            {task.pickup_lat && task.pickup_lng && task.dropoff_lat && task.dropoff_lng && (
                                <RoadRoute 
                                    id={`task-route-${task.id}`}
                                    from={[task.pickup_lng, task.pickup_lat]}
                                    to={[task.dropoff_lng, task.dropoff_lat]}
                                    color={isFocused ? "#10b981" : "#10b981"}
                                    width={isFocused ? 4 : 2}
                                    opacity={isFocused ? 0.8 : 0.25}
                                    dashArray={isFocused ? undefined : [3, 2]}
                                    animate={task.status === 'in_progress'}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </Map>

            <MonitoringStats 
                className="absolute top-3 left-3 z-10"
                vehiclesCount={vehicles.length}
                activeVehiclesCount={activeVehiclesCount}
                tasksCount={tasks.length}
                hubsCount={locations.length}
                showHubs={showHubs}
                onToggleHubs={() => setShowHubs(!showHubs)}
            />

            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
                <MapSearch 
                    onSelect={(result) => {
                        if (mapRef.current) {
                            mapRef.current.flyTo({
                                center: result.coordinates,
                                zoom: 15,
                                essential: true
                            });
                        }
                    }}
                    placeholder={t('admin:search_locations') || "Search locations..."}
                />
            </div>
        </div>
    );
});
