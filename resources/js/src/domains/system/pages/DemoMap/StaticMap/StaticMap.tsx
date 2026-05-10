import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapRoute, MarkerLabel } from '@/components/ui/map';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Route as RouteIcon, Loader2, Info, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { MapLoading } from '@/components/shared/map/MapLoading';
import { FloatingRouteList } from '@/components/shared/map/FloatingRouteList';
import { cn } from '@/lib/utils';

import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';

const StartMarkerIcon = () => <div className="size-4 rounded-full bg-green-500 border-2 border-white shadow-md" />;

const EndMarkerIcon = () => <div className="size-4 rounded-full bg-red-500 border-2 border-white shadow-md" />;

const start = { name: 'Phnom Penh City Center', lng: 104.88362845542673, lat: 11.564134606461863 };
const end = { name: 'Olympic Market', lng: 104.9120305870781, lat: 11.558576999146839 };

interface RouteData {
    coordinates: [number, number][];
    duration: number; // seconds
    distance: number; // meters
}

function formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

const MapDemo = () => {
    const [viewport, setViewport] = useState({
        center: [start.lng, start.lat] as [number, number],
        zoom: 13,
        bearing: 0,
        pitch: 0,
    });

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRoutes() {
            setIsLoading(true);
            try {
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`);
                const data = await response.json();

                if (data.routes?.length > 0) {
                    const routeData: RouteData[] = data.routes.map((route: any) => ({
                        coordinates: route.geometry.coordinates,
                        duration: route.duration,
                        distance: route.distance,
                    }));
                    setRoutes(routeData);
                }
            } catch (error) {
                console.error('Failed to fetch routes:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRoutes();
    }, []);

    // Sort routes: non-selected first, selected last (renders on top)
    const sortedRoutes = routes
        .map((route, index) => ({ route, index }))
        .sort((a, b) => {
            if (a.index === selectedIndex) return 1;
            if (b.index === selectedIndex) return -1;
            return 0;
        });

    return (
        <div className="flex flex-col gap-4">
            <PageHeader title="Real-World Travel Route" subtitle="Fetching real-time driving directions from OSRM between Phnom Penh city center and Olympic Market." />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 h-[600px] rounded-xl border bg-card shadow-sm overflow-hidden relative">
                    <Map viewport={viewport} onViewportChange={setViewport} className="h-full w-full" language="km">
                        <MapControls position="top-right" showLocate onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])} />

                        {sortedRoutes.map(({ route, index }) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <MapRoute
                                    key={index}
                                    coordinates={route.coordinates}
                                    color={isSelected ? '#10b981' : '#94a3b8'}
                                    width={isSelected ? 6 : 4}
                                    opacity={isSelected ? 1 : 0.6}
                                    onClick={() => setSelectedIndex(index)}
                                    interactive
                                />
                            );
                        })}

                        <MapMarker longitude={start.lng} latitude={start.lat}>
                            <MarkerContent>
                                <StartMarkerIcon />
                                <MarkerLabel position="top">{start.name}</MarkerLabel>
                            </MarkerContent>
                            <MarkerPopup>
                                <div className="p-2">
                                    <h3 className="font-bold">{start.name}</h3>
                                    <p className="text-xs text-muted-foreground">Start Point</p>
                                </div>
                            </MarkerPopup>
                        </MapMarker>

                        <MapMarker longitude={end.lng} latitude={end.lat}>
                            <MarkerContent>
                                <EndMarkerIcon />
                                <MarkerLabel position="bottom">{end.name}</MarkerLabel>
                            </MarkerContent>
                            <MarkerPopup>
                                <div className="p-2">
                                    <h3 className="font-bold">{end.name}</h3>
                                    <p className="text-xs text-muted-foreground">Destination</p>
                                </div>
                            </MarkerPopup>
                        </MapMarker>

                        <UserLocationMarker coordinates={userLocation} />
                    </Map>

                    {routes.length > 0 && (
                        <FloatingRouteList routes={routes} selectedIndex={selectedIndex} onSelect={setSelectedIndex} formatDuration={formatDuration} formatDistance={formatDistance} />
                    )}

                    {isLoading && <MapLoading message="Calculating routes..." />}
                </div>

                <div className="lg:col-span-1 space-y-4 overflow-y-auto p-1 pt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Route Details</CardTitle>
                            <CardDescription>Live direction info</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                        <MapPin className="size-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From</span>
                                        <span className="text-xs font-semibold truncate max-w-[180px]">{start.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                                        <Navigation className="size-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To</span>
                                        <span className="text-xs font-semibold truncate max-w-[180px]">{end.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Clock className="size-3.5" /> Time
                                    </span>
                                    <span className="font-bold">{routes.length > 0 ? formatDuration(routes[selectedIndex].duration) : '--'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <RouteIcon className="size-3.5" /> Distance
                                    </span>
                                    <span className="font-bold">{routes.length > 0 ? formatDistance(routes[selectedIndex].distance) : '--'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <Info className="size-4 text-primary" />
                                Instructions
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-[11px] space-y-2 text-muted-foreground font-medium">
                                <li className="flex gap-2">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                    View real-world driving paths
                                </li>
                                <li className="flex gap-2">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                    Select different routes above
                                </li>
                                <li className="flex gap-2">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                    Hover over routes to highlight
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MapDemo;
