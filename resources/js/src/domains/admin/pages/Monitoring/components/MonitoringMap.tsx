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
import { Truck, MapPin, Activity, ShieldAlert, ClipboardList, Navigation as NavigationIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { echo } from '@/lib/echo';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';

import { Task } from '@/domains/admin/pages/Tasks/services/taskService';
import { MonitoringStats } from './MonitoringStats';

interface MonitoringMapProps {
    locations: Location[];
    vehicles: Vehicle[];
    tasks: Task[];
    isLoading?: boolean;
    isFetching?: boolean;
    focusTarget?: { id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] } | null;
}

export const MonitoringMap = React.memo(({ 
    locations, 
    vehicles, 
    tasks,
    isLoading, 
    isFetching,
    focusTarget
}: MonitoringMapProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const { user } = useAuthStore();
    const mapRef = React.useRef<any>(null);
    const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
    
    const [viewport, setViewport] = useState({
        center: [104.9282, 11.5564] as [number, number], // Default to Phnom Penh
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'hub' | 'vehicle' | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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

    // Synchronize props to live state
    useEffect(() => {
        setLiveVehicles(vehicles);
    }, [vehicles]);

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

                {/* Render Hubs */}
                {locations.map((location) => (
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
                            {/* Pickup Hero Marker */}
                            {task.pickup_lat && task.pickup_lng && (
                                <MapMarker 
                                    longitude={task.pickup_lng} 
                                    latitude={task.pickup_lat}
                                    onClick={() => {
                                        setSelectedId(task.id);
                                        setSelectedType('task');
                                    }}
                                >
                                    <MarkerContent>
                                        <div className={cn(
                                            "relative group flex flex-col items-center gap-0.5 transition-all duration-300",
                                            isFocused ? "scale-110 z-50" : "scale-100"
                                        )}>
                                            {/* Pulsing Rings */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="absolute size-6 bg-blue-500/30 rounded-full animate-ping" />
                                                <div className="absolute size-8 bg-blue-500/10 rounded-full animate-pulse" />
                                            </div>
                                            
                                            {/* Marker Pin */}
                                            <div className="relative p-1.5 bg-blue-600 text-white rounded-lg shadow-lg border-2 border-white transition-transform hover:scale-110">
                                                <MapPin size={12} strokeWidth={3} />
                                            </div>
                                            
                                            {/* Hero Label */}
                                            <div className="bg-blue-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow-md border border-white/20 whitespace-nowrap uppercase tracking-tighter">
                                                P: {task.title.substring(0, 10)}
                                            </div>
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* Dropoff Hero Marker */}
                            {task.dropoff_lat && task.dropoff_lng && (
                                <MapMarker 
                                    longitude={task.dropoff_lng} 
                                    latitude={task.dropoff_lat}
                                    onClick={() => {
                                        setSelectedId(task.id);
                                        setSelectedType('task');
                                    }}
                                >
                                    <MarkerContent>
                                        <div className={cn(
                                            "relative group flex flex-col items-center gap-0.5 transition-all duration-300",
                                            isFocused ? "scale-110 z-50" : "scale-100"
                                        )}>
                                            {/* Marker Pin */}
                                            <div className="relative p-1.5 bg-destructive text-white rounded-lg shadow-lg border-2 border-white transition-transform hover:scale-110">
                                                <NavigationIcon size={12} strokeWidth={3} />
                                            </div>
                                            
                                            {/* Hero Label */}
                                            <div className="bg-destructive text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow-md border border-white/20 whitespace-nowrap uppercase tracking-tighter">
                                                D: {task.contact_name || 'DEST'}
                                            </div>
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* Route Line */}
                            {task.pickup_lat && task.pickup_lng && task.dropoff_lat && task.dropoff_lng && (
                                <RoadRoute 
                                    id={`task-route-${task.id}`}
                                    from={[task.pickup_lng, task.pickup_lat]}
                                    to={[task.dropoff_lng, task.dropoff_lat]}
                                    color={isFocused ? "#2563eb" : "#94a3b8"}
                                    width={isFocused ? 4 : 2}
                                    opacity={isFocused ? 0.8 : 0.3}
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
            />
        </div>
    );
});
