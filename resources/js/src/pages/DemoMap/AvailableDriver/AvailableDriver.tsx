import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    Map, 
    MapControls, 
    MapMarker, 
    MarkerContent, 
    MapCircle, 
    MarkerPopup, 
    MarkerLabel,
    useMap 
} from '@/components/ui/map';
import { Button } from '@/components/ui/button';
import { Car, Bike, MapPin, RefreshCw, Navigation as NavIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapSearch } from '@/components/shared/map/MapSearch';
import { AvailableDriverHeader } from './components/AvailableDriverHeader';
import { DriverList } from './components/DriverList';
import { RadiusControl } from './components/RadiusControl';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';

import { Driver } from './types';
import { Badge } from '@/components/ui/badge';

import { useQuery } from '@tanstack/react-query';
import { MapLoading } from '@/components/shared/map/MapLoading';

const PHNOM_PENH_CENTER: [number, number] = [104.9282, 11.5621];

const names = ['Sok Sombo', 'Vuthy Vong', 'Dara Kim', 'Bona Chea', 'Nary Seng', 'Piseth Mean', 'Rithy Khem', 'Srey Leak', 'Mony Phal', 'Theara Un', 'Channa Ouk', 'Sovann Long'];

function getRandomPointInCircle(center: [number, number], radiusKm: number): [number, number] {
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos(center[1] * Math.PI / 180);
    const r = Math.sqrt(Math.random()) * radiusKm;
    const theta = Math.random() * 2 * Math.PI;
    return [
        center[0] + (r * Math.cos(theta)) / kmPerDegreeLng,
        center[1] + (r * Math.sin(theta)) / kmPerDegreeLat
    ];
}

function calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371;
    const dLat = (point2[1] - point1[1]) * Math.PI / 180;
    const dLng = (point2[0] - point1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock API function
const fetchDrivers = async (center: [number, number], radius: number): Promise<Driver[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return Array.from({ length: 15 + Math.floor(Math.random() * 10) }).map((_, i) => {
        const coords = getRandomPointInCircle(center, radius);
        const dist = calculateDistance(center, coords);
        const rand = Math.random();
        let status: 'online' | 'busy' | 'offline' = 'online';
        if (rand > 0.85) status = 'offline';
        else if (rand > 0.6) status = 'busy';
        return {
            id: `driver-${i}-${Date.now()}`,
            name: names[Math.floor(Math.random() * names.length)],
            vehicleType: Math.random() > 0.4 ? 'car' : 'bike',
            rating: Number((4.0 + Math.random() * 1.0).toFixed(1)),
            distance: dist,
            coordinates: coords,
            status,
            lastSeen: status === 'offline' ? `${Math.floor(Math.random() * 60) + 1}m ago` : undefined,
            velocity: [(Math.random() - 0.5) * 0.00003, (Math.random() - 0.5) * 0.00003]
        };
    });
};


const AvailableDriver = () => {
    const [center, setCenter] = useState<[number, number]>(PHNOM_PENH_CENTER);
    const [radius, setRadius] = useState(5);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'busy' | 'offline'>('all');
    const [sortType, setSortType] = useState<'distance' | 'rating'>('distance');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    
    const [viewport, setViewport] = useState({
        center: PHNOM_PENH_CENTER,
        zoom: 13,
        pitch: 0,
        bearing: 0
    });

    const animationRef = useRef<number>(0);
    const driversRef = useRef<Driver[]>([]);

    // TanStack Query for driver data
    const { data: driversData = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['drivers', center, radius],
        queryFn: () => fetchDrivers(center, radius),
        refetchInterval: 5000, // Auto-poll every 5 seconds
        staleTime: 4000,
    });

    // Drivers state for animation
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const isMounted = useRef(true);

    // Update state and ref when fresh data arrives
    useEffect(() => {
        if (driversData.length > 0) {
            setDrivers(driversData);
            driversRef.current = driversData;
        }
    }, [driversData]);

    // Auto-locate on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                setUserLocation(coords);
                setCenter(coords);
                setViewport(prev => ({
                    ...prev,
                    center: coords,
                    zoom: 14,
                    transitionDuration: 2000
                }));
            }, (error) => {
                console.log("Auto-locate skipped or denied:", error.message);
            });
        }
    }, []);

    const refreshDrivers = () => {
        refetch();
    };

    const animate = useCallback(() => {
        const updatedDrivers = driversRef.current.map(driver => {
            if (driver.status !== 'online') return driver;

            // Move slightly
            if (!driver.velocity) return driver;

            let newLng = driver.coordinates[0] + driver.velocity[0];
            let newLat = driver.coordinates[1] + driver.velocity[1];

            // Check if still in circle, if not bounce back
            const dist = calculateDistance(center, [newLng, newLat]);
            let newVel = [...driver.velocity] as [number, number];
            
            if (dist > radius) {
                // Point towards center
                newVel = [
                    (center[0] - newLng) * 0.000005 + (Math.random() - 0.5) * 0.00003,
                    (center[1] - newLat) * 0.000005 + (Math.random() - 0.5) * 0.00003
                ];
            }

            return {
                ...driver,
                coordinates: [newLng, newLat] as [number, number],
                distance: calculateDistance(center, [newLng, newLat]),
                velocity: newVel
            };
        });

        driversRef.current = updatedDrivers;
        if (isMounted.current) {
            setDrivers(updatedDrivers);
            animationRef.current = requestAnimationFrame(animate);
        }
    }, [center, radius]);

    useEffect(() => {
        isMounted.current = true;
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            isMounted.current = false;
            cancelAnimationFrame(animationRef.current);
        };
    }, [animate]);

    const filteredDrivers = useMemo(() => {
        let result = [...drivers];
        
        if (statusFilter !== 'all') {
            result = result.filter(d => d.status === statusFilter);
        }
        
        if (sortType === 'distance') {
            result.sort((a, b) => a.distance - b.distance);
        } else {
            result.sort((a, b) => b.rating - a.rating);
        }
        
        return result;
    }, [drivers, statusFilter, sortType]);

    const handleSearchSelect = (result: any) => {
        const coords: [number, number] = result.coordinates;
        setCenter(coords);
        setViewport(prev => ({
            ...prev,
            center: coords,
            zoom: 14,
            transitionDuration: 1500
        }));
    };

    const handleMapClick = (e: any) => {
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setCenter(lngLat);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            <AvailableDriverHeader 
                driverCount={filteredDrivers.length} 
                status={`Searching within ${radius}km of current location`} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 h-full relative rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Map
                        viewport={viewport}
                        onViewportChange={setViewport}
                        onClick={handleMapClick}
                        className="h-full w-full"
                        language="km"
                    >
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
                            <MapSearch 
                                onSelect={handleSearchSelect} 
                                className="w-full"
                            />
                        </div>

                        <MapControls 
                            position="top-right" 
                            showZoom
                            showCompass
                            showLocate 
                            onLocate={(pos) => {
                                const coords: [number, number] = [pos.longitude, pos.latitude];
                                setCenter(coords);
                                setUserLocation(coords);
                            }}
                        />

                        <UserLocationMarker coordinates={userLocation} />

                        {/* Search Range Circle */}
                        <MapCircle 
                            center={center} 
                            radius={radius} 
                            color="#3b82f6" 
                            opacity={0.1}
                            strokeColor="#3b82f6"
                            strokeWidth={2}
                            strokeOpacity={0.3}
                        />

                        {/* Center Marker */}
                        <MapMarker longitude={center[0]} latitude={center[1]} draggable onDragEnd={(pos) => setCenter([pos.lng, pos.lat])}>
                            <MarkerContent>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150" />
                                    <div className="size-8 rounded-full bg-primary border-4 border-white shadow-xl flex items-center justify-center text-white">
                                        <MapPin className="size-4" />
                                    </div>
                                    <MarkerLabel position="top" className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full ring-1 ring-primary ring-offset-2 ring-offset-background font-bold shadow-lg">SEARCH CENTER</MarkerLabel>
                                </div>
                            </MarkerContent>
                        </MapMarker>

                        {/* Driver Markers */}
                        {filteredDrivers.map((driver) => (
                            <MapMarker 
                                key={driver.id} 
                                longitude={driver.coordinates[0]} 
                                latitude={driver.coordinates[1]}
                                onClick={() => setSelectedDriver(driver)}
                            >
                                <MarkerContent>
                                    <div className={cn(
                                        "relative group cursor-pointer transition-transform hover:scale-110",
                                        selectedDriver?.id === driver.id && "scale-110 z-10"
                                    )}>
                                        <div className={cn(
                                            "size-8 rounded-full bg-white border-2 shadow-md flex items-center justify-center transition-colors",
                                            driver.status === 'online' ? "border-emerald-500 text-emerald-600" : 
                                            driver.status === 'busy' ? "border-amber-500 text-amber-600" :
                                            "border-slate-400 text-slate-500",
                                            selectedDriver?.id === driver.id && "bg-primary border-primary text-white"
                                        )}>
                                            {driver.vehicleType === 'car' ? <Car className="size-4" /> : <Bike className="size-4" />}
                                        </div>
                                        {selectedDriver?.id === driver.id && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-background border rounded px-1.5 py-0.5 text-[8px] font-bold shadow-sm">
                                                {driver.name}
                                            </div>
                                        )}
                                    </div>
                                </MarkerContent>
                                {selectedDriver?.id === driver.id && (
                                    <MarkerPopup closeButton onClose={() => setSelectedDriver(null)}>
                                        <div className="space-y-2 min-w-[150px]">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-full bg-muted border overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} alt={driver.name} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold">{driver.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground">{driver.vehicleType.toUpperCase()} • {driver.rating} ★</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-muted" />
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-muted-foreground">Distance:</span>
                                                <span className="font-bold">{driver.distance.toFixed(2)} km</span>
                                            </div>
                                            {driver.status === 'offline' && driver.lastSeen && (
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-muted-foreground">Last Seen:</span>
                                                    <span className="font-bold text-amber-600">{driver.lastSeen}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-muted-foreground">Status:</span>
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] h-4 uppercase",
                                                    driver.status === 'online' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : 
                                                    driver.status === 'busy' ? "text-amber-600 border-amber-200 bg-amber-50" :
                                                    "text-slate-600 border-slate-200 bg-slate-50"
                                                )}>
                                                    {driver.status}
                                                </Badge>
                                            </div>
                                            <Button size="xs" className="w-full h-7 text-[10px]">Request Ride</Button>
                                        </div>
                                    </MarkerPopup>
                                )}
                            </MapMarker>
                        ))}
                    </Map>

                    {/* Radius Control Overlay */}
                    <div className="absolute bottom-6 left-6 z-10 w-64">
                        <RadiusControl radius={radius} onRadiusChange={setRadius} />
                    </div>

                    {/* Refresh Button - Positioned to match MapControls */}
                    <div className="absolute top-2 right-12 z-10">
                        <div className="flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm">
                            <button 
                                onClick={refreshDrivers}
                                disabled={isFetching}
                                className={cn(
                                    "flex size-8 items-center justify-center transition-all",
                                    "hover:bg-accent dark:hover:bg-accent/40",
                                    "disabled:opacity-50"
                                )}
                                title="Refresh drivers"
                            >
                                <RefreshCw className={cn("size-4 text-foreground/80", isFetching && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    {/* Only show the full-page overlay on the VERY first load */}
                    {isLoading && <MapLoading message="Locating drivers..." />}
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-full">
                    <DriverList 
                        drivers={filteredDrivers} 
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        sortType={sortType}
                        onSortChange={setSortType}
                        onSelect={(d) => {
                            setSelectedDriver(d);
                            setViewport(v => ({
                                ...v,
                                center: d.coordinates,
                                transitionDuration: 1000
                            }));
                        }} 
                        selectedId={selectedDriver?.id}
                    />
                </div>
            </div>
        </div>
    );
};

export default AvailableDriver;
