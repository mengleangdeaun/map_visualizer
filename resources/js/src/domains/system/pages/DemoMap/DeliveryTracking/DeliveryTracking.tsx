import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapRoute, MarkerPopup, MarkerLabel } from '@/components/ui/map';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, MapPin, Store, Package, Navigation, Clock, CheckCircle2, Phone, MessageSquare, Bike, Zap, FastForward, Trash2, X, ArrowUpDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { FloatingRouteList } from '@/components/shared/map/FloatingRouteList';
import { MapSearch } from '@/components/shared/map/MapSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeliveryHeader } from './components/DeliveryHeader';
import { VehicleSelector } from './components/VehicleSelector';
import { LocationSection } from './components/LocationSection';
import { PlaybackControls } from './components/PlaybackControls';
import { TrackingStats } from './components/TrackingStats';

interface RouteData {
    coordinates: [number, number][];
    duration: number;
    distance: number;
}

// Helper to calculate bearing between two points
function calculateBearing(start: [number, number], end: [number, number]) {
    const startLng = (start[0] * Math.PI) / 180;
    const startLat = (start[1] * Math.PI) / 180;
    const endLng = (end[0] * Math.PI) / 180;
    const endLat = (end[1] * Math.PI) / 180;

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

// Simple linear interpolation between two points
function interpolate(start: [number, number], end: [number, number], t: number): [number, number] {
    return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
}

function formatDuration(minutes: number): string {
    if (minutes === 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

const DeliveryTracking = () => {
    const [viewport, setViewport] = useState({
        center: [104.9281, 11.565] as [number, number],
        zoom: 14,
        pitch: 45,
        bearing: 0,
    });
    const [pickup, setPickup] = useState<[number, number] | null>(null);
    const [dropoff, setDropoff] = useState<[number, number] | null>(null);
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [distance, setDistance] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [status, setStatus] = useState('Select Pickup Location');
    const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'tuk_tuk'>('car');
    const [simSpeed, setSimSpeed] = useState(1);
    const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
    const [searchLabel, setSearchLabel] = useState('');
    const [pickupLabel, setPickupLabel] = useState('Not Set');
    const [dropoffLabel, setDropoffLabel] = useState('Not Set');

    // Consolidate high-frequency animation states to reduce re-renders
    const [tracking, setTracking] = useState<{
        pos: [number, number] | null;
        bearing: number;
        progress: number;
        eta: number;
    }>({
        pos: null,
        bearing: 0,
        progress: 0,
        eta: 0,
    });

    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const isMounted = useRef(true);
    const DURATION_PER_KM = 60000; // Base: 60 seconds per km (60km/h) for realistic feel

    const googleKhmerStyle = useMemo<any>(() => {
        return {
            light: {
                version: 8,
                sources: {
                    'google-tiles': {
                        type: 'raster',
                        tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=km'],
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
                    },
                ],
            },
            dark: {
                version: 8,
                sources: {
                    'google-tiles': {
                        type: 'raster',
                        tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=km'],
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
        } as const;
    }, []);

    const handleMapClick = async (e: any) => {
        if (isAnimating) return;

        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        if (!pickup) {
            setPickup(lngLat);
            setPickupLabel(`Map Pin (${lngLat[0].toFixed(4)}, ${lngLat[1].toFixed(4)})`);
            setStatus('Select Dropoff Location');
        } else if (!dropoff) {
            setDropoff(lngLat);
            setDropoffLabel(`Map Pin (${lngLat[0].toFixed(4)}, ${lngLat[1].toFixed(4)})`);
            setStatus('Ready to Start');
            await fetchRoute(pickup, lngLat);
        } else {
            // Reset and start over
            setPickup(lngLat);
            setPickupLabel(`Map Pin (${lngLat[0].toFixed(4)}, ${lngLat[1].toFixed(4)})`);
            setDropoff(null);
            setDropoffLabel('Not Set');
            setRoutes([]);
            setSelectedIndex(0);
            setTracking({ pos: null, bearing: 0, progress: 0, eta: 0 });
            setStatus('Select Dropoff Location');
        }
    };

    const handleSearchSelect = (result: any) => {
        const coords: [number, number] = result.coordinates;
        setSearchMarker(coords);
        setSearchLabel(result.name);
        setViewport((prev) => ({
            ...prev,
            center: coords,
            zoom: 16,
            transitionDuration: 1500,
        }));
    };

    const swapLocations = () => {
        if (isAnimating) return;
        const tempPos = pickup;
        const tempLabel = pickupLabel;

        setPickup(dropoff);
        setPickupLabel(dropoffLabel);
        setDropoff(tempPos);
        setDropoffLabel(tempLabel);

        if (dropoff && pickup) {
            fetchRoute(dropoff, pickup);
        } else {
            setRoutes([]);
        }
    };

    const fetchRoute = async (start: [number, number], end: [number, number]) => {
        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&alternatives=true`);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes?.length > 0) {
                const routeData: RouteData[] = data.routes.map((r: any) => ({
                    coordinates: r.geometry.coordinates,
                    duration: r.duration,
                    distance: r.distance,
                }));
                setRoutes(routeData);
                setSelectedIndex(0);

                const selected = routeData[0];
                setDistance(selected.distance / 1000);
                const durationMins = Math.round(selected.duration / 60);
                setTracking((t) => ({ ...t, eta: durationMins }));
                setTotalDuration(durationMins);
            }
        } catch (error) {
            console.error('Routing error:', error);
            // Fallback
            setRoutes([
                {
                    coordinates: [start, end],
                    duration: 600,
                    distance: 5000,
                },
            ]);
        }
    };

    const focusDriver = () => {
        if (tracking.pos) {
            setViewport((prev) => ({
                ...prev,
                center: tracking.pos as [number, number],
                zoom: 17,
                pitch: 45,
                transitionDuration: 1000,
            }));
        }
    };

    const startDelivery = () => {
        if (!routes.length) return;
        setIsAnimating(true);
        setStatus('On the way');
        startTimeRef.current = 0;
        animationRef.current = requestAnimationFrame(animate);
    };

    const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = (time - startTimeRef.current) * simSpeed;
        const currentRoute = routes[selectedIndex].coordinates;
        const animationDuration = Math.max(5000, distance * DURATION_PER_KM);
        const t = Math.min(1, elapsed / animationDuration);

        // Calculate position along the detailed route
        const totalPoints = currentRoute.length;
        const pathIndex = t * (totalPoints - 1);
        const currentIndex = Math.floor(pathIndex);
        const segmentT = pathIndex % 1;

        if (currentIndex < totalPoints - 1) {
            const start = currentRoute[currentIndex];
            const end = currentRoute[currentIndex + 1];
            const pos = interpolate(start, end, segmentT);
            const brng = calculateBearing(start, end);

            if (isMounted.current) {
                setTracking({
                    pos,
                    bearing: brng,
                    progress: Math.round(t * 100),
                    eta: Math.max(1, Math.round(totalDuration * (1 - t))),
                });
            }
        } else {
            setTracking({
                pos: currentRoute[totalPoints - 1],
                bearing: tracking.bearing,
                progress: 100,
                eta: 0,
            });
            setIsAnimating(false);
            setStatus('Delivered');
            return;
        }

        if (isMounted.current) {
            animationRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const cancelDelivery = () => {
        setIsAnimating(false);
        cancelAnimationFrame(animationRef.current);
        setStatus('Delivery Cancelled');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <PageHeader title="Delivery Tracking" subtitle={status}>
                {isAnimating && (
                    <Button variant="destructive" onClick={cancelDelivery} className="animate-in fade-in p-4 slide-in-from-right-4 duration-300">
                        <Trash2 className="size-4 mr-2" />
                        Cancel Delivery
                    </Button>
                )}
                {pickup && dropoff && !isAnimating && status === 'Ready to Start' && (
                    <Button onClick={startDelivery} className="bg-emerald-600 p-4 hover:bg-emerald-700 animate-in zoom-in duration-300">
                        <Navigation className="size-4 mr-2" />
                        Start Delivery
                    </Button>
                )}
                {(status === 'Delivered' || status === 'Delivery Cancelled' || (pickup && !isAnimating && status !== 'Ready to Start')) && (
                    <Button
                        variant="outline"
                        className="p-4"
                        onClick={() => {
                            setPickup(null);
                            setDropoff(null);
                            setRoutes([]);
                            setSelectedIndex(0);
                            setTracking({
                                pos: null,
                                bearing: 0,
                                progress: 0,
                                eta: 0,
                            });
                            setSearchMarker(null);
                            setPickupLabel('Not Set');
                            setDropoffLabel('Not Set');
                            setStatus('Select Pickup Location');
                        }}
                    >
                        Reset
                    </Button>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 py-1">
                    <Card className="h-full relative p-0 overflow-hidden">
                        <Map viewport={viewport} onViewportChange={setViewport} onClick={handleMapClick} className="h-full w-full" language="km" styles={googleKhmerStyle}>
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
                                <MapSearch onSelect={handleSearchSelect} className="w-full" />
                            </div>

                            <MapControls position="top-right" showZoom showCompass showLocate onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])} />

                            <UserLocationMarker coordinates={userLocation} />

                            {/* Route Lines */}
                            {routes.length > 0 && (
                                <>
                                    {routes.map((r, index) => {
                                        const isSelected = index === selectedIndex;
                                        // Don't show alternative routes while animating
                                        if (isAnimating && !isSelected) return null;

                                        return (
                                            <MapRoute
                                                key={index}
                                                coordinates={r.coordinates}
                                                color="#10b981"
                                                width={isSelected ? 10 : 6}
                                                opacity={isSelected ? (isAnimating ? 0.35 : 1) : 0.2}
                                                dashArray={undefined}
                                                onClick={() => {
                                                    if (!isAnimating) {
                                                        setSelectedIndex(index);
                                                        setDistance(r.distance / 1000);
                                                        const durationMins = Math.round(r.duration / 60);
                                                        setTracking((t) => ({ ...t, eta: durationMins }));
                                                        setTotalDuration(durationMins);
                                                    }
                                                }}
                                                interactive={!isAnimating}
                                            />
                                        );
                                    })}
                                    {isAnimating && (
                                        <>
                                            {/* Ultra Outer Glow */}
                                            <MapRoute
                                                coordinates={routes[selectedIndex].coordinates
                                                    .slice(0, Math.floor(tracking.progress / (100 / (routes[selectedIndex].coordinates.length - 1))) + 1)
                                                    .concat(tracking.pos ? [tracking.pos] : [])}
                                                color="#10b981"
                                                width={16}
                                                opacity={0.15}
                                                blur={8}
                                            />
                                            {/* Core Glow */}
                                            <MapRoute
                                                coordinates={routes[selectedIndex].coordinates
                                                    .slice(0, Math.floor(tracking.progress / (100 / (routes[selectedIndex].coordinates.length - 1))) + 1)
                                                    .concat(tracking.pos ? [tracking.pos] : [])}
                                                color="#10b981"
                                                width={8}
                                                opacity={0.4}
                                                blur={3}
                                            />
                                            {/* Inner Bright Line */}
                                            <MapRoute
                                                coordinates={routes[selectedIndex].coordinates
                                                    .slice(0, Math.floor(tracking.progress / (100 / (routes[selectedIndex].coordinates.length - 1))) + 1)
                                                    .concat(tracking.pos ? [tracking.pos] : [])}
                                                color="#10b981"
                                                width={6}
                                                opacity={1}
                                            />
                                        </>
                                    )}
                                </>
                            )}

                            {/* Pickup Point */}
                            {pickup && (
                                <MapMarker longitude={pickup[0]} latitude={pickup[1]}>
                                    <MarkerContent>
                                        <div className="size-8 rounded-full bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
                                            <Store className="size-4" />
                                        </div>
                                        <MarkerLabel position="top" className="bg-background px-2 py-0.5 rounded shadow-sm font-bold text-[10px]">
                                            PICKUP
                                        </MarkerLabel>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* Dropoff Point */}
                            {dropoff && (
                                <MapMarker longitude={dropoff[0]} latitude={dropoff[1]}>
                                    <MarkerContent>
                                        <div className="size-8 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white">
                                            <MapPin className="size-4" />
                                        </div>
                                        <MarkerLabel position="top" className="bg-background px-2 py-0.5 rounded shadow-sm font-bold text-[10px]">
                                            DROPOFF
                                        </MarkerLabel>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* Search Result Marker */}
                            {searchMarker && (
                                <MapMarker longitude={searchMarker[0]} latitude={searchMarker[1]}>
                                    <MarkerContent>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                            <div className="relative size-10 rounded-full bg-white border-2 border-emerald-500 shadow-2xl flex items-center justify-center">
                                                <MapPin className="size-5 text-emerald-600" />
                                            </div>
                                            <MarkerLabel
                                                position="top"
                                                className="bg-background/70 backdrop-blur-sm px-3 py-2.5 rounded-lg shadow-xl border flex flex-col items-center gap-1.5 min-w-[120px]"
                                            >
                                                <span className="text-sm font-bold text-foreground truncate max-w-[300px]">{searchLabel}</span>
                                                {!isAnimating && (
                                                    <div className="flex gap-1 w-full">
                                                        {!pickup && (
                                                            <Button
                                                                size="xs"
                                                                className="flex-1 text-[8px] h-8 bg-emerald-600"
                                                                onClick={() => {
                                                                    setPickup(searchMarker);
                                                                    setPickupLabel(searchLabel);
                                                                    setSearchMarker(null);
                                                                    setStatus('Select Dropoff Location');
                                                                }}
                                                            >
                                                                Set Pickup
                                                            </Button>
                                                        )}
                                                        {pickup && !dropoff && (
                                                            <Button
                                                                size="xs"
                                                                className="flex-1 text-[8px] h-8"
                                                                onClick={() => {
                                                                    setDropoff(searchMarker);
                                                                    setDropoffLabel(searchLabel);
                                                                    setSearchMarker(null);
                                                                    setStatus('Ready to Start');
                                                                    fetchRoute(pickup, searchMarker);
                                                                }}
                                                            >
                                                                Set Dropoff
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </MarkerLabel>
                                            <button
                                                onClick={() => setSearchMarker(null)}
                                                className="absolute -top-2 -right-2 size-5 rounded-full bg-destructive text-white border-2 border-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* The Animated Car */}
                            {tracking.pos && (
                                <MapMarker longitude={tracking.pos[0]} latitude={tracking.pos[1]} rotation={tracking.bearing} rotationAlignment="map">
                                    <MarkerContent>
                                        <div className="relative group cursor-pointer">
                                            {/* Custom Car SVG */}
                                            <div className="relative transition-transform group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                                                <img src="/assets/images/map/car.svg" alt="Car" className="w-6 h-auto" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                            </div>
                                        </div>
                                        {tracking.eta > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-primary scale-110 text-white text-sm font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                                                {formatDuration(tracking.eta)}
                                            </div>
                                        )}
                                    </MarkerContent>
                                </MapMarker>
                            )}
                        </Map>

                        {/* Floating Map Overlay */}
                        {isAnimating && (
                            <div className="absolute top-3 left-3 p-4 rounded-xl border bg-background/70 dark:bg-background/90 backdrop-blur-md shadow-xl max-w-xs space-y-3 animate-in slide-in-from-bottom-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full overflow-hidden bg-muted border">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Driver" className="size-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">Sok Sombo</h4>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <span className="text-emerald-500 font-bold">4.9 ★</span> • Toyota Prius (2AA-9999)
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="size-8 rounded-full hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 transition-colors"
                                        onClick={focusDriver}
                                        title="Center on Driver"
                                    >
                                        <Target className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        {/* Floating Route List */}
                        {routes.length > 0 && !isAnimating && (
                            <FloatingRouteList
                                routes={routes}
                                selectedIndex={selectedIndex}
                                onSelect={(index) => {
                                    setSelectedIndex(index);
                                    const r = routes[index];
                                    setDistance(r.distance / 1000);
                                    const durationMins = Math.round(r.duration / 60);
                                    setTracking((t) => ({ ...t, eta: durationMins }));
                                    setTotalDuration(durationMins);
                                }}
                                formatDuration={formatDuration}
                                formatDistance={(d) => `${(d / 1000).toFixed(2)} km`}
                            />
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto p-1 -mx-1 h-full">
                    <Card className="flex flex-col flex-1 min-h-0">
                        <DeliveryHeader status={status} eta={tracking.eta} formatDuration={formatDuration} />

                        <CardContent className="flex-1 min-h-0 p-0">
                            <ScrollArea className="h-full px-4">
                                <div className="space-y-6 pb-6">
                                    <VehicleSelector vehicleType={vehicleType} setVehicleType={setVehicleType} />

                                    <LocationSection
                                        pickup={pickup}
                                        pickupLabel={pickupLabel}
                                        dropoff={dropoff}
                                        dropoffLabel={dropoffLabel}
                                        isAnimating={isAnimating}
                                        onClearAll={() => {
                                            setPickup(null);
                                            setPickupLabel('Not Set');
                                            setDropoff(null);
                                            setDropoffLabel('Not Set');
                                            setRoutes([]);
                                            setStatus('Select Pickup Location');
                                        }}
                                        onClearPickup={() => {
                                            setPickup(null);
                                            setPickupLabel('Not Set');
                                            setRoutes([]);
                                            setStatus('Select Pickup Location');
                                        }}
                                        onClearDropoff={() => {
                                            setDropoff(null);
                                            setDropoffLabel('Not Set');
                                            setRoutes([]);
                                            setStatus('Select Dropoff Location');
                                        }}
                                        onSwap={swapLocations}
                                    />

                                    <PlaybackControls simSpeed={simSpeed} setSimSpeed={setSimSpeed} isAnimating={isAnimating} />

                                    <div className="h-px bg-gradient-to-r from-transparent via-muted to-transparent" />

                                    <TrackingStats
                                        isAnimating={isAnimating}
                                        status={status}
                                        progress={tracking.progress}
                                        eta={tracking.eta}
                                        distance={distance}
                                        totalDuration={totalDuration}
                                        formatDuration={formatDuration}
                                    />
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTracking;
