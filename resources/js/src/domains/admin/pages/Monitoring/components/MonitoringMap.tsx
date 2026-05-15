import React, { useState, useEffect, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel, MapRoute } from '@/components/ui/map';
import { Location } from '@/domains/fleet/services/locationService';
import { Vehicle } from '@/domains/admin/services/vehicleService';
import { HubMarker } from '@/domains/system/pages/Location/components/HubMarker/HubMarker';
import { VehicleMarker } from './VehicleMarker';
import { Card } from '@/components/ui/card';
import { MapLoading } from '@/components/shared/map/MapLoading';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin, Activity, ShieldAlert, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { echo } from '@/lib/echo';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';

import { Task } from '@/domains/admin/tasks/services/taskService';

interface MonitoringMapProps {
    locations: Location[];
    vehicles: Vehicle[];
    tasks: Task[];
    isLoading?: boolean;
    isFetching?: boolean;
    focusTarget?: { id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] } | null;
}

export const MonitoringMap = ({ 
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

    // Initial centering
    useEffect(() => {
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
                {tasks.map((task) => (
                    <React.Fragment key={task.id}>
                        {/* Pickup Marker */}
                        {task.pickup_lat && task.pickup_lng && (
                            <MapMarker 
                                longitude={task.pickup_lng} 
                                latitude={task.pickup_lat}
                                onClick={() => setSelectedId(task.id)}
                            >
                                <MarkerContent>
                                    <div className="relative group cursor-pointer">
                                        <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                                        <div className="p-1.5 bg-blue-600 text-white rounded-md shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                                            <MapPin size={12} />
                                        </div>
                                    </div>
                                </MarkerContent>
                                <MarkerLabel position="bottom">
                                    <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm">
                                        P: {task.title.substring(0, 10)}
                                    </span>
                                </MarkerLabel>
                            </MapMarker>
                        )}

                        {/* Dropoff Marker */}
                        {task.dropoff_lat && task.dropoff_lng && (
                            <MapMarker 
                                longitude={task.dropoff_lng} 
                                latitude={task.dropoff_lat}
                                onClick={() => setSelectedId(task.id)}
                            >
                                <MarkerContent>
                                    <div className="relative group cursor-pointer">
                                        <div className="p-1.5 bg-destructive text-white rounded-md shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                                            <MapPin size={12} />
                                        </div>
                                    </div>
                                </MarkerContent>
                                <MarkerLabel position="bottom">
                                    <span className="bg-destructive text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm">
                                        D: {task.receiver_name || task.id.substring(0, 4)}
                                    </span>
                                </MarkerLabel>
                            </MapMarker>
                        )}

                        {/* Route Line */}
                        {task.pickup_lat && task.pickup_lng && task.dropoff_lat && task.dropoff_lng && (
                            <MapRoute 
                                id={`task-route-${task.id}`}
                                coordinates={[
                                    [task.pickup_lng, task.pickup_lat],
                                    [task.dropoff_lng, task.dropoff_lat]
                                ]}
                                color="#2563eb"
                                width={2}
                                opacity={0.4}
                                dashArray={[3, 2]}
                                animate={task.status === 'in_progress'}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Map>

            {/* Floating Stats Panel */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <Card className="bg-background/80 backdrop-blur-md shadow-xl p-3 flex items-center gap-4 transition-all hover:bg-background">
                    <div className="flex items-center gap-2 pr-4 border-r">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Truck size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-none mb-1">
                                {t('admin:vehicles')}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black">{activeVehiclesCount}</span>
                                <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1 rounded animate-pulse">LIVE</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pr-4 border-r">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <ClipboardList size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-none mb-1">
                                {t('admin:tasks') || 'Tasks'}
                            </span>
                            <span className="text-sm font-black">{tasks.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <MapPin size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-none mb-1">
                                {t('admin:hubs')}
                            </span>
                            <span className="text-sm font-black">{locations.length}</span>
                        </div>
                    </div>
                </Card>

                {/* Secondary indicators */}
                <div className="flex gap-2">
                    <div className="bg-background/80 backdrop-blur-md border rounded-lg px-2.5 py-1.5 shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-l-4 border-l-green-500">
                        <Activity size={12} className="text-green-500" />
                        System Optimal
                    </div>
                    {vehicles.length > activeVehiclesCount && (
                        <div className="bg-background/80 backdrop-blur-md border rounded-lg px-2.5 py-1.5 shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-l-4 border-l-destructive">
                            <ShieldAlert size={12} className="text-destructive" />
                            {vehicles.length - activeVehiclesCount} Offline
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
