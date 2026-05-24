import React, { useState, useEffect } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerLabel } from '@/components/ui/map';
import { RoadRoute } from '@/components/shared/map/RoadRoute';
import { Location } from '@/domains/fleet/services/locationService';
import { Vehicle } from '@/domains/admin/services/vehicleService';
import { HubMarker } from '@/domains/system/pages/Location/components/HubMarker/HubMarker';
import { VehicleMarker } from './VehicleMarker';
import { Card } from '@/components/ui/card';
import { MapLoading } from '@/components/shared/map/MapLoading';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin, Activity, ShieldAlert, ClipboardList, Plus, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Task } from '@/domains/admin/pages/Tasks/services/taskService';
import { Delivery } from '@/domains/admin/services/deliveryService';
import { MonitoringStats } from './MonitoringStats';
import { useMonitoringTelemetry } from '../hooks/useMonitoringTelemetry';
import { MapSearch } from '@/components/shared/map/MapSearch';
import { PickupMarker, DropoffMarker, DeliveryMarker } from '@/components/shared/map/TaskMarkers';
import { getRoadblockTypeStyles, RoadblockType } from '@/domains/admin/utils/roadBlockType';
import { Roadblock, MonitoringFocusTarget, MonitoringViewport } from '../types';
import { HeroLabel } from './HeroLabel';
import { Button } from '@/components/ui/button';



interface MonitoringMapProps {
    locations: Location[];
    vehicles: Vehicle[];
    tasks: Task[];
    deliveries: Delivery[];
    roadblocks: Roadblock[];
    pendingRoadAlert?: { lat: number, lng: number } | null;
    onResolveRoadblock?: (id: string | number) => void;
    onResetSelection?: () => void;
    isLoading?: boolean;
    isFetching?: boolean;
    isResolvingRoadblock?: boolean;
    focusTarget?: MonitoringFocusTarget | null;
    onClick?: (e: any) => void;
    pendingPickup?: { lat: number, lng: number } | null;
    pendingDropoff?: { lat: number, lng: number } | null;
    pendingDeliveryDropoff?: { lat: number, lng: number } | null;
    onCreateTask?: () => void;
    onCreateDelivery?: () => void;
    onCreateRoadblock?: () => void;
}

// RoadBlockCreationCard removed as creation has been refactored to RoadblockDialog modal.

export const MonitoringMap = React.memo(({ 
    locations, 
    vehicles, 
    tasks,
    deliveries,
    roadblocks = [],
    pendingRoadAlert,
    onResolveRoadblock,
    onResetSelection,
    isLoading, 
    isFetching,
    isResolvingRoadblock,
    focusTarget,
    onClick,
    pendingPickup,
    pendingDropoff,
    pendingDeliveryDropoff,
    onCreateTask,
    onCreateDelivery,
    onCreateRoadblock
}: MonitoringMapProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const mapRef = React.useRef<any>(null);

    const [viewport, setViewport] = useState<MonitoringViewport>({
        center: [104.9282, 11.5564] as [number, number], // Default to Phnom Penh
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    const {
        liveVehicles,
        googleKhmerStyle,
        userLocation,
        setUserLocation,
        activeVehiclesCount
    } = useMonitoringTelemetry({
        vehicles,
        locations,
        focusTarget,
        setViewport
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'hub' | 'vehicle' | 'task' | 'delivery' | 'road_alert' | null>(null);
    const [showHubs, setShowHubs] = useState(false);
    const [showTasks, setShowTasks] = useState(true);
    const [showDeliveries, setShowDeliveries] = useState(true);

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

    // Clean up selected roadblock if it is resolved and disappears from the roadblocks list
    useEffect(() => {
        if (selectedType === 'road_alert' && selectedId) {
            const stillExists = roadblocks.some(r => String(r.id) === selectedId);
            if (!stillExists) {
                setSelectedId(null);
                setSelectedType(null);
            }
        }
    }, [roadblocks, selectedId, selectedType]);

    if (isLoading && vehicles.length === 0 && locations.length === 0) {
        return (
            <Card className="h-full w-full relative overflow-hidden rounded-xl border bg-muted/5 flex items-center justify-center">
                <MapLoading message={t('admin:loading_monitoring_data') || "Loading Monitoring Data..."} />
            </Card>
        );
    }

    return (
        <div className="relative h-full w-full group/map">
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
                                    onClick={(e: React.MouseEvent) => {
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

                {pendingDeliveryDropoff && (
                    <DeliveryMarker 
                        longitude={pendingDeliveryDropoff.lng} 
                        latitude={pendingDeliveryDropoff.lat}
                        label={t('admin:new_delivery_destination') || "New Destination"}
                        className="animate-in zoom-in duration-300"
                    >
                        <MarkerLabel position="top" className="mb-10 pointer-events-auto">
                            <Button 
                                size="sm" 
                                className="rounded-full py-4 px-3 shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold animate-in zoom-in slide-in-from-bottom-2 duration-500"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onCreateDelivery?.();
                                }}
                            >
                                <Plus className="mr-1.5 size-3.5" strokeWidth={3} />
                                {t('admin:create_delivery_now') || 'Create Delivery Now'}
                            </Button>
                        </MarkerLabel>
                    </DeliveryMarker>
                )}

                {pendingRoadAlert && (
                    <MapMarker
                        longitude={pendingRoadAlert.lng}
                        latitude={pendingRoadAlert.lat}
                    >
                        <MarkerContent className="animate-bounce">
                            <div className="relative size-9 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center animate-in zoom-in duration-300">
                                <AlertTriangle className="size-4 text-white" />
                                <span className="absolute inset-0 rounded-full animate-ping bg-red-600 opacity-40" />
                            </div>
                        </MarkerContent>
                    </MapMarker>
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

                {/* Render Roadblocks */}
                {roadblocks.map((roadblock) => {
                    const isSelected = selectedType === 'road_alert' && selectedId === String(roadblock.id);
                    const coords = [Number(roadblock.lng), Number(roadblock.lat)];
                    if (isNaN(coords[0]) || isNaN(coords[1])) return null;

                    const styles = getRoadblockTypeStyles(roadblock.type as RoadblockType);

                    return (
                        <MapMarker
                            key={roadblock.id}
                            longitude={coords[0]}
                            latitude={coords[1]}
                            onClick={() => {
                                if (selectedType === 'road_alert' && selectedId === String(roadblock.id)) {
                                    setSelectedId(null);
                                    setSelectedType(null);
                                } else {
                                    setSelectedId(String(roadblock.id));
                                    setSelectedType('road_alert');
                                }
                            }}
                        >
                            <MarkerContent className="group">
                                <div className={cn(
                                    "relative size-9 rounded-full bg-background/90 border-2 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110",
                                    isSelected ? "border-primary scale-115 ring-2 ring-primary/40" : styles.border
                                )}>
                                    <span className={cn(
                                        "absolute inset-0 rounded-full animate-ping opacity-30",
                                        styles.pulse
                                    )} />
                                    <AlertTriangle className={cn("size-4", isSelected ? "text-primary" : styles.color)} />
                                </div>
                            </MarkerContent>

                            <MarkerPopup 
                                className="p-0 border-none mb-4 bg-transparent shadow-none overflow-visible z-50"
                                open={isSelected}
                                onClose={() => {
                                    if (selectedType === 'road_alert' && selectedId === String(roadblock.id)) {
                                        setSelectedId(null);
                                        setSelectedType(null);
                                    }
                                }}
                            >
                                <Card className="p-4 w-72 bg-background/95 backdrop-blur-md shadow-2xl rounded-2xl flex flex-col gap-3 font-sans animate-in zoom-in-95 duration-200">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 rounded-full flex items-center justify-center bg-destructive/10 text-destructive">
                                                <AlertTriangle className="size-3.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                                    {roadblock.type || 'Hazard'} Alert
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {new Date(roadblock.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 font-black", styles.badge)}>
                                                {roadblock.type || 'Blockage'}
                                            </Badge>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5 rounded-md hover:bg-muted p-0 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedId(null);
                                                    setSelectedType(null);
                                                }}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/50 p-2.5 rounded-xl border border-dashed text-left">
                                        "{roadblock.description || 'No description provided'}"
                                    </p>

                                    <div className="flex flex-col gap-1 text-[10px] text-muted-foreground border-t pt-2">
                                        <div className="flex justify-between">
                                            <span>Latitude:</span>
                                            <span className="font-mono text-foreground">{Number(roadblock.lat).toFixed(6)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Longitude:</span>
                                            <span className="font-mono text-foreground">{Number(roadblock.lng).toFixed(6)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full rounded-xl py-4 font-bold text-xs mt-1"
                                        disabled={isResolvingRoadblock}
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            if (onResolveRoadblock) {
                                                onResolveRoadblock(roadblock.id);
                                            }
                                        }}
                                    >
                                        {isResolvingRoadblock ? (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                <span>Resolving...</span>
                                            </span>
                                        ) : (
                                            "Resolve Roadblock"
                                        )}
                                    </Button>
                                </Card>
                            </MarkerPopup>
                        </MapMarker>
                    );
                })}

                {/* Render Tasks */}
                {showTasks && tasks.map((task) => {
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

                {/* Render Deliveries */}
                {showDeliveries && deliveries.map((delivery) => {
                    const isFocused = selectedType === 'delivery' && selectedId === delivery.id;
                    if (!delivery.dropoff_latitude || !delivery.dropoff_longitude) return null;

                    return (
                        <React.Fragment key={delivery.id}>
                            <DeliveryMarker 
                                longitude={Number(delivery.dropoff_longitude)}
                                latitude={Number(delivery.dropoff_latitude)}
                                isFocused={isFocused}
                                label={`D: ${delivery.order?.customer?.name || delivery.tracking_number.substring(0, 8)}`}
                                onClick={() => {
                                    setSelectedId(delivery.id);
                                    setSelectedType('delivery');
                                }}
                            />
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
                deliveriesCount={deliveries.length}
                showHubs={showHubs}
                onToggleHubs={() => setShowHubs(!showHubs)}
                showTasks={showTasks}
                onToggleTasks={() => setShowTasks(!showTasks)}
                showDeliveries={showDeliveries}
                onToggleDeliveries={() => setShowDeliveries(!showDeliveries)}
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

            <HeroLabel />
        </div>
    );
});
