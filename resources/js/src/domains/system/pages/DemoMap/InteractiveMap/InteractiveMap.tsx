import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapRoute, MarkerLabel } from '@/components/ui/map';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Clock, Route as RouteIcon, MapPin, Flag, Trash2, MousePointer2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { MapLoading } from '@/components/shared/map/MapLoading';
import { FloatingRouteList } from '@/components/shared/map/FloatingRouteList';
import { cn } from '@/lib/utils';

import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';

const StartMarkerIcon = () => (
    <div className="size-5 rounded-full bg-green-500 border-2 border-white shadow-md flex items-center justify-center">
        <MapPin className="size-3 text-white" />
    </div>
);

const EndMarkerIcon = () => (
    <div className="size-5 rounded-full bg-red-500 border-2 border-white shadow-md flex items-center justify-center">
        <Flag className="size-3 text-white" />
    </div>
);

interface Location {
    lng: number;
    lat: number;
    name?: string;
}

interface RouteData {
    coordinates: [number, number][];
    duration: number;
    distance: number;
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

const DemoMap = () => {
    const [viewport, setViewport] = useState({
        center: [104.88362845542673, 11.564134606461863] as [number, number],
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    const [start, setStart] = useState<Location | null>(null);
    const [end, setEnd] = useState<Location | null>(null);
    const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    const fetchRoute = useCallback(async (s: Location, e: Location) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${e.lng},${e.lat}?overview=full&geometries=geojson&alternatives=true`);
            const data = await response.json();

            if (data.routes?.length > 0) {
                const routeData: RouteData[] = data.routes.map((r: any) => ({
                    coordinates: r.geometry.coordinates,
                    duration: r.duration,
                    distance: r.distance,
                }));
                setRoutes(routeData);
            }
        } catch (error) {
            console.error('Failed to fetch route:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (start && end) {
            fetchRoute(start, end);
        } else {
            setRoutes([]);
        }
    }, [start, end, fetchRoute]);

    const handleMapClick = (e: any) => {
        const { lng, lat } = e.lngLat;
        const newLoc = { lng, lat };

        if (selectionMode === 'start') {
            setStart(newLoc);
            // Auto switch to end mode if start is set
            if (!end) setSelectionMode('end');
        } else {
            setEnd(newLoc);
        }
    };

    const clearSelection = () => {
        setStart(null);
        setEnd(null);
        setRoutes([]);
        setSelectedIndex(0);
        setSelectionMode('start');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            <PageHeader title="Interactive Route Planner" subtitle="Set your start and end points by clicking on the map." />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6  flex-1 min-h-0">
                <div className="lg:col-span-3 h-full relative rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Map viewport={viewport} onViewportChange={setViewport} onClick={handleMapClick} className="h-full w-full" language="km">
                        <MapControls position="top-right" showLocate onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])} />

                        {/* Start Marker */}
                        {start && (
                            <MapMarker longitude={start.lng} latitude={start.lat}>
                                <MarkerContent>
                                    <StartMarkerIcon />
                                    <MarkerLabel position="top" className="mb-3">
                                        <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">PICKUP</span>
                                        </div>
                                    </MarkerLabel>
                                </MarkerContent>
                                <MarkerPopup>
                                    <div className="p-2">
                                        <p className="font-bold">Start Point</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {start.lng.toFixed(4)}, {start.lat.toFixed(4)}
                                        </p>
                                    </div>
                                </MarkerPopup>
                            </MapMarker>
                        )}

                        {/* End Marker */}
                        {end && (
                            <MapMarker longitude={end.lng} latitude={end.lat}>
                                <MarkerContent>
                                    <EndMarkerIcon />
                                    <MarkerLabel position="top" className="mb-3">
                                        <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-rose-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">DESTINATION</span>
                                        </div>
                                    </MarkerLabel>
                                </MarkerContent>
                                <MarkerPopup>
                                    <div className="p-2">
                                        <p className="font-bold">Destination</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {end.lng.toFixed(4)}, {end.lat.toFixed(4)}
                                        </p>
                                    </div>
                                </MarkerPopup>
                            </MapMarker>
                        )}

                        {/* Route Lines */}
                        {routes.map((route, index) => {
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

                        <UserLocationMarker coordinates={userLocation} />
                    </Map>
                    {/* Instruction Overlay */}
                    {(!start || !end) && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                            <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full border shadow-lg flex items-center gap-3 animate-bounce">
                                <MousePointer2 className="size-4 text-primary" />
                                <span className="text-sm font-medium">{!start ? 'Click to set Start Point' : 'Now click to set Destination'}</span>
                            </div>
                        </div>
                    )}
                    {/* Floating Route List */}
                    {routes.length > 0 && (
                        <FloatingRouteList routes={routes} selectedIndex={selectedIndex} onSelect={setSelectedIndex} formatDuration={formatDuration} formatDistance={formatDistance} />
                    )}
                    {isLoading && <MapLoading message="Calculating best route..." />}
                </div>

                <div className="lg:col-span-1 space-y-4 overflow-y-auto p-1 pt-0">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1 mb-4">
                                    <CardTitle>Route Planner</CardTitle>
                                    <CardDescription>Set points to calculate route</CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearSelection}
                                    className="size-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                                    title="Clear all"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>

                            <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-background/50">
                                    <TabsTrigger value="start" className="gap-2 text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">
                                        <div className="size-1.5 rounded-full bg-current" /> Pickup
                                    </TabsTrigger>
                                    <TabsTrigger value="end" className="gap-2 text-xs font-bold data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all">
                                        <Flag className="size-3" /> Dropoff
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="space-y-0 pt-0">
                            <div className="space-y-8 relative">
                                {/* Vertical Path Line */}
                                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500 via-slate-200 dark:via-slate-800 to-rose-500" />

                                <div className="relative !m-0 pl-9">
                                    <div
                                        className={cn(
                                            'absolute left-0 top-1 size-6 rounded-full bg-white border-4 flex items-center justify-center shadow-lg z-10 transition-colors duration-300',
                                            start ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-800',
                                        )}
                                    >
                                        <div className={cn('size-1.5 rounded-full', start ? 'bg-emerald-500' : 'bg-slate-300')} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn('size-1 rounded-full', start ? 'bg-emerald-500' : 'bg-slate-300')} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">Pickup Point</span>
                                            </div>
                                            {start && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={() => navigator.clipboard.writeText(`${start.lng}, ${start.lat}`)}
                                                    className="size-6 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 transition-all"
                                                >
                                                    <Copy className="size-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div
                                            className={cn(
                                                'group relative flex flex-col gap-1 p-3.5 rounded-xl border-2 transition-all duration-300',
                                                start ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/50 border-dashed border-slate-200 dark:border-slate-800 opacity-60',
                                            )}
                                        >
                                            <span className="text-[11px] font-mono font-bold tracking-tighter text-foreground/80">
                                                {start ? `${start.lng.toFixed(6)}, ${start.lat.toFixed(6)}` : 'Click on map to set pickup'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-9">
                                    <div
                                        className={cn(
                                            'absolute left-0 top-1 size-6 rounded-full bg-white border-4 flex items-center justify-center shadow-lg z-10 transition-colors duration-300',
                                            end ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800',
                                        )}
                                    >
                                        <Flag className={cn('size-3', end ? 'text-rose-500 fill-rose-500' : 'text-slate-300')} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Flag className={cn('size-2.5', end ? 'text-rose-500 fill-rose-500' : 'text-slate-300')} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">Destination</span>
                                            </div>
                                            {end && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={() => navigator.clipboard.writeText(`${end.lng}, ${end.lat}`)}
                                                    className="size-6 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                >
                                                    <Copy className="size-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div
                                            className={cn(
                                                'group relative flex flex-col gap-1 p-3.5 rounded-xl border-2 transition-all duration-300',
                                                end ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-500/20 ' : 'bg-muted/50 border-dashed border-slate-200 dark:border-slate-800 opacity-60',
                                            )}
                                        >
                                            <span className="text-[11px] font-mono font-bold tracking-tighter text-foreground/80">
                                                {end ? `${end.lng.toFixed(6)}, ${end.lat.toFixed(6)}` : 'Waiting for destination...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DemoMap;
