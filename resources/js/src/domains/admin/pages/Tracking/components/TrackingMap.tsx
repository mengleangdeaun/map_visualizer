import React, { useState, useEffect, useRef } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel } from '@/components/ui/map';
import { RoadRoute } from '@/components/shared/map/RoadRoute';
import { PickupMarker, DropoffMarker, DeliveryMarker } from '@/components/shared/map/TaskMarkers';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Navigation } from 'lucide-react';
import { Delivery } from '../../../services/deliveryService';
import { Task } from '../../Tasks/services/taskService';
import { PushPin, MapLabel } from '@/components/shared/map/BaseMarker';
import { echo } from '@/lib/echo';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';

import { TrackingMapProps } from '../types';

export const TrackingMap = ({ type, item }: TrackingMapProps) => {
    const mapRef = useRef<any>(null);
    const { user } = useAuthStore();

    const [viewport, setViewport] = useState({
        center: [104.9282, 11.5564] as [number, number], // Default to Phnom Penh
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    // Extract coordinates for delivery or task destination points
    const coordinates = React.useMemo(() => {
        if (type === 'delivery') {
            const d = item as Delivery;
            const dropoffLng = d.dropoff_longitude ? Number(d.dropoff_longitude) : null;
            const dropoffLat = d.dropoff_latitude ? Number(d.dropoff_latitude) : null;
            
            // Transit hub coordinates
            const currentHubLng = d.current_hub?.longitude ? Number(d.current_hub.longitude) : null;
            const currentHubLat = d.current_hub?.latitude ? Number(d.current_hub.latitude) : null;
            
            return {
                dropoff: dropoffLat && dropoffLng ? { lat: dropoffLat, lng: dropoffLng } : null,
                currentHub: currentHubLat && currentHubLng ? { lat: currentHubLat, lng: currentHubLng } : null,
            };
        } else {
            const t = item as Task;
            const pickupLng = t.pickup_lng ? Number(t.pickup_lng) : null;
            const pickupLat = t.pickup_lat ? Number(t.pickup_lat) : null;
            const dropoffLng = t.dropoff_lng ? Number(t.dropoff_lng) : null;
            const dropoffLat = t.dropoff_lat ? Number(t.dropoff_lat) : null;
            
            return {
                pickup: pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null,
                dropoff: dropoffLat && dropoffLng ? { lat: dropoffLat, lng: dropoffLng } : null,
            };
        }
    }, [type, item]);

    // Extract driver/vehicle details and initial coordinates
    const driverInfo = React.useMemo(() => {
        const driverName = item.driver?.name || 'Driver';
        
        let targetVehicle: any = null;
        if (type === 'delivery') {
            const d = item as any;
            targetVehicle = d.driver?.vehicles?.[0];
        } else {
            const t = item as any;
            targetVehicle = t.vehicle || t.driver?.vehicles?.[0];
        }
        
        const vehicleId = targetVehicle?.id || null;
        
        let initialCoords: [number, number] | null = null;
        if (targetVehicle && targetVehicle.latitude && targetVehicle.longitude) {
            initialCoords = [Number(targetVehicle.longitude), Number(targetVehicle.latitude)];
        }
        
        return {
            driverName,
            vehicleId,
            initialCoords,
        };
    }, [type, item]);

    const [liveDriverCoords, setLiveDriverCoords] = useState<[number, number] | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Sync live coordinates to initial loaded coordinates
    useEffect(() => {
        setLiveDriverCoords(driverInfo.initialCoords);
    }, [driverInfo.initialCoords]);

    // Real-time telemetry connection via Laravel Echo
    useEffect(() => {
        if (!echo || !user || !driverInfo.vehicleId) return;

        const companyId = user.company_id;
        const channelName = companyId ? `fleet.${companyId}` : 'telemetry.public';
        const channel = companyId ? echo.private(channelName) : echo.channel(channelName);

        console.log(`TrackingMap: Subscribing to channel:`, channelName, `for vehicle:`, driverInfo.vehicleId);

        channel.listen('.vehicle.location.updated', (event: any) => {
            if (event.vehicle_id === driverInfo.vehicleId) {
                console.log('TrackingMap: Live telemetry coordinate received:', event.longitude, event.latitude);
                setLiveDriverCoords([Number(event.longitude), Number(event.latitude)]);
            }
        });

        return () => {
            echo.leave(channelName);
        };
    }, [user?.company_id, driverInfo.vehicleId]);

    // Track active target focus
    useEffect(() => {
        if (!mapRef.current) return;
        
        let boundsPoints: [number, number][] = [];
        
        if (type === 'delivery' && coordinates.dropoff) {
            boundsPoints.push([coordinates.dropoff.lng, coordinates.dropoff.lat]);
            if (coordinates.currentHub) {
                boundsPoints.push([coordinates.currentHub.lng, coordinates.currentHub.lat]);
            }
        } else if (type === 'task') {
            if (coordinates.pickup) {
                boundsPoints.push([coordinates.pickup.lng, coordinates.pickup.lat]);
            }
            if (coordinates.dropoff) {
                boundsPoints.push([coordinates.dropoff.lng, coordinates.dropoff.lat]);
            }
        }

        // Include driver in initial fit bounds
        if (driverInfo.initialCoords) {
            boundsPoints.push(driverInfo.initialCoords);
        }

        if (boundsPoints.length > 0) {
            if (boundsPoints.length === 1) {
                mapRef.current.flyTo({
                    center: boundsPoints[0],
                    zoom: 14,
                    speed: 1.2,
                    essential: true
                });
            } else {
                // Fit bounds
                const lats = boundsPoints.map(p => p[1]);
                const lngs = boundsPoints.map(p => p[0]);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                
                mapRef.current.fitBounds(
                    [[minLng, minLat], [maxLng, maxLat]],
                    { padding: 80, duration: 1500 }
                );
            }
        }
    }, [type, item.id, coordinates, driverInfo.initialCoords]);

    const hasNoCoordinates = type === 'delivery' 
        ? !coordinates.dropoff 
        : !coordinates.pickup && !coordinates.dropoff;

    if (hasNoCoordinates) {
        return (
            <Card className="h-full w-full flex flex-col items-center justify-center bg-muted/20 border-dashed border-2 p-6 text-center">
                <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                    <MapPin className="size-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg">{type === 'delivery' ? 'No Destination Coordinate' : 'No Coordinates Set'}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    This {type} does not have coordinates mapped yet. Assign location coordinates on the dashboard to visualize it on this map.
                </p>
            </Card>
        );
    }

    return (
        <Card className="h-full w-full relative overflow-hidden p-0 rounded-xl">
            <Map
                ref={mapRef}
                viewport={viewport}
                onViewportChange={setViewport}
                language='en'
                className="h-full w-full"
            >
                <MapControls position="top-right" 
                    showZoom 
                    showCompass 
                    showLocate
                    onLocate={(pos) => {
                        setUserLocation([pos.longitude, pos.latitude]);
                        setViewport({
                            center: [pos.longitude, pos.latitude],
                            zoom: 14,
                            bearing: 0,
                            pitch: 0,
                        });
                    }}
                />

                {/* Delivery Dropoff Pin */}
                {type === 'delivery' && coordinates.dropoff && (
                    <DeliveryMarker
                        longitude={coordinates.dropoff.lng}
                        latitude={coordinates.dropoff.lat}
                        label={`Destination: ${item.tracking_number}`}
                        isFocused={true}
                    />
                )}

                {/* Delivery Hub Location */}
                {type === 'delivery' && coordinates.currentHub && (
                    <MapMarker
                        longitude={coordinates.currentHub.lng}
                        latitude={coordinates.currentHub.lat}
                    >
                        <MarkerContent>
                            <PushPin color="bg-amber-500" isFocused={false}>
                                <Truck className="size-4 text-white" />
                            </PushPin>
                        </MarkerContent>
                    </MapMarker>
                )}

                {/* Task Pickup and Dropoff Pins */}
                {type === 'task' && coordinates.pickup && (
                    <PickupMarker
                        longitude={coordinates.pickup.lng}
                        latitude={coordinates.pickup.lat}
                        label="Pickup Origin"
                        isFocused={true}
                    />
                )}

                {type === 'task' && coordinates.dropoff && (
                    <DropoffMarker
                        longitude={coordinates.dropoff.lng}
                        latitude={coordinates.dropoff.lat}
                        label="Dropoff Destination"
                        isFocused={true}
                    />
                )}

                {/* Task Route Path */}
                {type === 'task' && coordinates.pickup && coordinates.dropoff && (
                    <RoadRoute
                        id={`track-task-route-${item.id}`}
                        from={[coordinates.pickup.lng, coordinates.pickup.lat]}
                        to={[coordinates.dropoff.lng, coordinates.dropoff.lat]}
                        color="#10b981"
                        width={4}
                        opacity={0.8}
                        animate={item.status === 'in_progress'}
                    />
                )}

                {/* Admin's Geolocation Location Marker */}
                {userLocation && (
                    <UserLocationMarker 
                        coordinates={userLocation} 
                        label="YOU"
                    />
                )}

                {/* Driver Live Location Marker */}
                {liveDriverCoords && (
                    <MapMarker
                        longitude={liveDriverCoords[0]}
                        latitude={liveDriverCoords[1]}
                        anchor="bottom"
                    >
                        <MarkerContent className="z-40">
                            <PushPin color="bg-primary" isFocused={true}>
                                <Truck className="size-4 text-white animate-pulse" />
                            </PushPin>
                            <MarkerLabel position="top" className="mb-1">
                                <MapLabel type="default" isFocused={true}>
                                    {driverInfo.driverName}
                                </MapLabel>
                            </MarkerLabel>
                        </MarkerContent>
                    </MapMarker>
                )}
            </Map>

            {/* Quick Stats Floating Overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-lg border shadow-lg flex items-center gap-2 max-w-sm">
                <div className="p-2 rounded bg-primary/10">
                    <Navigation className="size-4 text-primary animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs capitalize">{type} Route Status</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary text-primary">
                            Live
                        </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {type === 'delivery' 
                            ? (item as Delivery).dropoff_address || 'No destination address details.' 
                            : `${(item as Task).pickup_address || 'Origin'} ➔ ${(item as Task).dropoff_address || 'Destination'}`
                        }
                    </p>
                </div>
            </div>
        </Card>
    );
};
