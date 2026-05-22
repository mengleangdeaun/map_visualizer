import React, { useState, useEffect } from 'react';
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
import { Truck, MapPin, Activity, ShieldAlert, ClipboardList, Plus, AlertTriangle } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface MonitoringMapProps {
    locations: Location[];
    vehicles: Vehicle[];
    tasks: Task[];
    deliveries: Delivery[];
    roadblocks: any[];
    pendingRoadAlert?: { lat: number, lng: number } | null;
    onResolveRoadblock?: (id: string | number) => void;
    onResetSelection?: () => void;
    isLoading?: boolean;
    isFetching?: boolean;
    focusTarget?: { id: string; type: 'vehicle' | 'hub' | 'task' | 'delivery'; center: [number, number] } | null;
    onClick?: (e: any) => void;
    pendingPickup?: { lat: number, lng: number } | null;
    pendingDropoff?: { lat: number, lng: number } | null;
    pendingDeliveryDropoff?: { lat: number, lng: number } | null;
    onCreateTask?: () => void;
    onCreateDelivery?: () => void;
}

const RoadBlockCreationCard = ({ 
    lat, 
    lng, 
    onCancel, 
    onSuccess 
}: { 
    lat: number; 
    lng: number; 
    onCancel: () => void; 
    onSuccess: () => void;
}) => {
    const queryClient = useQueryClient();
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'blockage' | 'accident' | 'flood' | 'traffic'>('blockage');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error("Please enter a description for the hazard.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/admin/road-alerts', {
                description: description.trim(),
                type,
                lat,
                lng
            });
            toast.success("Road roadblock reported successfully.");
            queryClient.invalidateQueries({ queryKey: ['admin', 'road-alerts'] });
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create road alert.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="p-4 w-80 bg-background/95 backdrop-blur-md border shadow-2xl rounded-2xl flex flex-col gap-3 font-sans animate-in zoom-in slide-in-from-bottom-2 duration-300 text-left">
            <div className="flex items-center gap-2">
                <div className="size-7 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 animate-pulse">
                    <AlertTriangle className="size-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                        Report Roadblock
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                        Interactive Placement
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-black text-muted-foreground">Hazard Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full text-xs rounded-xl border bg-background px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                    >
                        <option value="blockage">Blockage / Road Closed</option>
                        <option value="accident">Accident</option>
                        <option value="flood">Flood / Water Accumulation</option>
                        <option value="traffic">Severe Traffic Jam</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-black text-muted-foreground">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter roadblock details (e.g. tree fell down, deep water)..."
                        className="w-full min-h-[70px] text-xs rounded-xl border bg-background p-3 font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        maxLength={1000}
                    />
                </div>

                <div className="flex items-center gap-2 border-t pt-2 mt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl py-3 font-bold text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl py-3 font-bold text-xs shadow-md bg-destructive hover:bg-destructive/90 text-white"
                    >
                        {isSubmitting ? 'Publishing...' : 'Confirm Hazard'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

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
    focusTarget,
    onClick,
    pendingPickup,
    pendingDropoff,
    pendingDeliveryDropoff,
    onCreateTask,
    onCreateDelivery
}: MonitoringMapProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const mapRef = React.useRef<any>(null);

    const [viewport, setViewport] = useState({
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
                                onClick={(e) => {
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
                            <div className="relative size-9 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center">
                                <AlertTriangle className="size-4 text-white" />
                                <span className="absolute inset-0 rounded-full animate-ping bg-red-600 opacity-40" />
                            </div>
                        </MarkerContent>
                        <MarkerLabel position="top" className="mb-12 pointer-events-auto z-50">
                            <RoadBlockCreationCard 
                                lat={pendingRoadAlert.lat} 
                                lng={pendingRoadAlert.lng} 
                                onCancel={onResetSelection || (() => {})} 
                                onSuccess={onResetSelection || (() => {})} 
                            />
                        </MarkerLabel>
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
                    const isSelected = selectedType === 'road_alert' && selectedId === roadblock.id;
                    const coords = [Number(roadblock.lng), Number(roadblock.lat)];
                    if (isNaN(coords[0]) || isNaN(coords[1])) return null;

                    let hazardColor = "bg-red-500 text-red-500";
                    let hazardBorder = "border-red-500";
                    let pulseRingColor = "bg-red-500";
                    
                    if (roadblock.type === 'accident') {
                        hazardColor = "bg-orange-500 text-orange-500";
                        hazardBorder = "border-orange-500";
                        pulseRingColor = "bg-orange-500";
                    } else if (roadblock.type === 'flood') {
                        hazardColor = "bg-blue-500 text-blue-500";
                        hazardBorder = "border-blue-500";
                        pulseRingColor = "bg-blue-500";
                    } else if (roadblock.type === 'traffic') {
                        hazardColor = "bg-amber-500 text-amber-500";
                        hazardBorder = "border-amber-500";
                        pulseRingColor = "bg-amber-500";
                    }

                    return (
                        <MapMarker
                            key={roadblock.id}
                            longitude={coords[0]}
                            latitude={coords[1]}
                            onClick={() => {
                                setSelectedId(roadblock.id);
                                setSelectedType('road_alert');
                            }}
                        >
                            <MarkerContent className="group">
                                <div className={cn(
                                    "relative size-9 rounded-full bg-background/90 border-2 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110",
                                    isSelected ? "border-primary scale-115 ring-2 ring-primary/40" : hazardBorder
                                )}>
                                    <span className={cn(
                                        "absolute inset-0 rounded-full animate-ping opacity-30",
                                        pulseRingColor
                                    )} />
                                    <AlertTriangle className={cn("size-4", isSelected ? "text-primary" : hazardColor)} />
                                </div>
                            </MarkerContent>

                            {isSelected && (
                                <MarkerLabel position="top" className="mb-12 pointer-events-auto z-40">
                                    <Card className="p-4 w-72 bg-background/95 backdrop-blur-md border shadow-2xl rounded-2xl flex flex-col gap-3 font-sans animate-in zoom-in slide-in-from-bottom-2 duration-300">
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
                                            <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 font-black", 
                                                roadblock.type === 'accident' ? 'border-orange-500/20 text-orange-500 bg-orange-500/5' :
                                                roadblock.type === 'flood' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' :
                                                roadblock.type === 'traffic' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                                                'border-red-500/20 text-red-500 bg-red-500/5'
                                            )}>
                                                {roadblock.type || 'Blockage'}
                                            </Badge>
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
                                            className="w-full rounded-xl py-4 font-bold text-xs shadow-md mt-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onResolveRoadblock) {
                                                    onResolveRoadblock(roadblock.id);
                                                    setSelectedId(null);
                                                    setSelectedType(null);
                                                }
                                            }}
                                        >
                                            Resolve Roadblock
                                        </Button>
                                    </Card>
                                </MarkerLabel>
                            )}
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
        </div>
    );
});
