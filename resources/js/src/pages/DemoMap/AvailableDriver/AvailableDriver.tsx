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

import { Driver } from './types';

const PHNOM_PENH_CENTER: [number, number] = [104.9282, 11.5621];

const names = ['Sok Sombo', 'Vuthy Vong', 'Dara Kim', 'Bona Chea', 'Nary Seng', 'Piseth Mean', 'Rithy Khem', 'Srey Leak', 'Mony Phal', 'Theara Un', 'Channa Ouk', 'Sovann Long'];

function getRandomPointInCircle(center: [number, number], radiusKm: number): [number, number] {
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos(center[1] * Math.PI / 180);

    const r = radiusKm * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    const lat = center[1] + (r / kmPerDegreeLat) * Math.sin(theta);
    const lng = center[0] + (r / kmPerDegreeLng) * Math.cos(theta);

    return [lng, lat];
}

function calculateDistance(p1: [number, number], p2: [number, number]) {
    const R = 6371; // Earth's radius in km
    const dLat = (p2[1] - p1[1]) * Math.PI / 180;
    const dLon = (p2[0] - p1[0]) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

const AvailableDriver = () => {
    const [center, setCenter] = useState<[number, number]>(PHNOM_PENH_CENTER);
    const [radius, setRadius] = useState(5);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewport, setViewport] = useState({
        center: PHNOM_PENH_CENTER,
        zoom: 13,
        pitch: 0,
        bearing: 0
    });

    const animationRef = useRef<number>(0);
    const driversRef = useRef<Driver[]>([]);

    const generateDrivers = useCallback((centerPos: [number, number], searchRadius: number) => {
        const newDrivers: Driver[] = Array.from({ length: 15 + Math.floor(Math.random() * 10) }).map((_, i) => {
            const coords = getRandomPointInCircle(centerPos, searchRadius);
            const dist = calculateDistance(centerPos, coords);
            return {
                id: `driver-${i}-${Date.now()}`,
                name: names[Math.floor(Math.random() * names.length)],
                vehicleType: Math.random() > 0.4 ? 'car' : 'bike',
                rating: 4.5 + Math.random() * 0.5,
                distance: dist,
                coordinates: coords,
                status: Math.random() > 0.2 ? 'online' : 'busy',
                velocity: [(Math.random() - 0.5) * 0.0001, (Math.random() - 0.5) * 0.0001]
            };
        });
        
        // Sort by distance
        newDrivers.sort((a, b) => a.distance - b.distance);
        
        setDrivers(newDrivers);
        driversRef.current = newDrivers;
    }, []);

    const refreshDrivers = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            generateDrivers(center, radius);
            setIsRefreshing(false);
        }, 800);
    };

    useEffect(() => {
        generateDrivers(center, radius);
    }, [center, radius, generateDrivers]);

    const animate = useCallback(() => {
        const kmPerDegreeLat = 111.32;
        const kmPerDegreeLng = 111.32 * Math.cos(center[1] * Math.PI / 180);

        const updatedDrivers = driversRef.current.map(driver => {
            if (driver.status === 'busy') return driver;

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
                    (center[0] - newLng) * 0.00001 + (Math.random() - 0.5) * 0.0001,
                    (center[1] - newLat) * 0.00001 + (Math.random() - 0.5) * 0.0001
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
        setDrivers(updatedDrivers);
        animationRef.current = requestAnimationFrame(animate);
    }, [center, radius]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [animate]);

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
                driverCount={drivers.length} 
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
                            }}
                        />

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
                                    <MarkerLabel position="top" className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">SEARCH CENTER</MarkerLabel>
                                </div>
                            </MarkerContent>
                        </MapMarker>

                        {/* Driver Markers */}
                        {drivers.map((driver) => (
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
                                            driver.status === 'online' ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600",
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

                    {/* Refresh Button */}
                    <div className="absolute top-6 right-16 z-10">
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className={cn("bg-background/90 backdrop-blur-md shadow-lg border", isRefreshing && "animate-spin")}
                            onClick={refreshDrivers}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-full">
                    <DriverList 
                        drivers={drivers} 
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
