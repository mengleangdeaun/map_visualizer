import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapRoute, MarkerLabel } from "@/components/ui/map";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Clock, Route as RouteIcon, MapPin, Flag, Trash2, MousePointer2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { MapLoading } from "@/components/shared/map/MapLoading";
import { FloatingRouteList } from "@/components/shared/map/FloatingRouteList";
import { cn } from "@/lib/utils";

import { UserLocationMarker } from "@/components/shared/map/UserLocationMarker";

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
    const [selectionMode, setSelectionMode] = useState<"start" | "end">("start");
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    const fetchRoute = useCallback(async (s: Location, e: Location) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${e.lng},${e.lat}?overview=full&geometries=geojson&alternatives=true`
            );
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
            console.error("Failed to fetch route:", error);
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

        if (selectionMode === "start") {
            setStart(newLoc);
            // Auto switch to end mode if start is set
            if (!end) setSelectionMode("end");
        } else {
            setEnd(newLoc);
        }
    };

    const clearSelection = () => {
        setStart(null);
        setEnd(null);
        setRoutes([]);
        setSelectedIndex(0);
        setSelectionMode("start");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            <PageHeader 
                title="Interactive Route Planner" 
                subtitle="Set your start and end points by clicking on the map."
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6  flex-1 min-h-0">
                <div className="lg:col-span-3 h-full relative rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Map
                        viewport={viewport}
                        onViewportChange={setViewport}
                        onClick={handleMapClick}
                        className="h-full w-full"
                        language="km"
                    >
                        <MapControls position="top-right" showLocate onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])} />

                        {/* Start Marker */}
                        {start && (
                            <MapMarker longitude={start.lng} latitude={start.lat}>
                                <MarkerContent>
                                    <StartMarkerIcon />
                                    <MarkerLabel position="top">Start</MarkerLabel>
                                </MarkerContent>
                                <MarkerPopup>
                                    <div className="p-2">
                                        <p className="font-bold">Start Point</p>
                                        <p className="text-[10px] text-muted-foreground">{start.lng.toFixed(4)}, {start.lat.toFixed(4)}</p>
                                    </div>
                                </MarkerPopup>
                            </MapMarker>
                        )}

                        {/* End Marker */}
                        {end && (
                            <MapMarker longitude={end.lng} latitude={end.lat}>
                                <MarkerContent>
                                    <EndMarkerIcon />
                                    <MarkerLabel position="bottom">Destination</MarkerLabel>
                                </MarkerContent>
                                <MarkerPopup>
                                    <div className="p-2">
                                        <p className="font-bold">Destination</p>
                                        <p className="text-[10px] text-muted-foreground">{end.lng.toFixed(4)}, {end.lat.toFixed(4)}</p>
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
                                    color={isSelected ? "#10b981" : "#94a3b8"}
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
                                <span className="text-sm font-medium">
                                    {!start ? "Click to set Start Point" : "Now click to set Destination"}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Floating Route List */}
                    {routes.length > 0 && (
                        <FloatingRouteList 
                            routes={routes}
                            selectedIndex={selectedIndex}
                            onSelect={setSelectedIndex}
                            formatDuration={formatDuration}
                            formatDistance={formatDistance}
                        />
                    )}
                    {isLoading && <MapLoading message="Calculating best route..." />}
                </div>

                <div className="lg:col-span-1 space-y-4 overflow-y-auto p-1 pt-0">
                    <Card>
                        <CardHeader className="space-y-4 pb-0">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Selection Info</CardTitle>
                                    <CardDescription>Coordinate selection</CardDescription>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={clearSelection} 
                                    className="size-8 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Clear all"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                            
                            <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-9">
                                    <TabsTrigger value="start" className="gap-2 text-xs">
                                        <MapPin className="size-3" /> Start
                                    </TabsTrigger>
                                    <TabsTrigger value="end" className="gap-2 text-xs">
                                        <Flag className="size-3" /> End
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            <div className="space-y-5 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border border-l border-dashed border-muted-foreground" />

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-1 size-[18px] rounded-full bg-background border-2 border-green-500 flex items-center justify-center shadow-sm z-10">
                                        <div className="size-1.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start Point</span>
                                            {start && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon-xs" 
                                                    onClick={() => navigator.clipboard.writeText(`${start.lng}, ${start.lat}`)}
                                                    className="size-5 h-5 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Copy className="size-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "group relative flex flex-col gap-0.5 p-3 rounded-lg border transition-all duration-200",
                                            start 
                                                ? "bg-accent border-primary shadow-sm" 
                                                : "bg-muted border-dashed border-border"
                                        )}>
                                            <span className="text-[11px] font-mono font-semibold tracking-tight">
                                                {start ? `${start.lng.toFixed(5)}, ${start.lat.toFixed(5)}` : "Select on map"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-1 size-[18px] rounded-full bg-background border-2 border-red-500 flex items-center justify-center shadow-sm z-10">
                                        <MapPin className="size-2.5 text-red-500 fill-current" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destination</span>
                                            {end && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon-xs" 
                                                    onClick={() => navigator.clipboard.writeText(`${end.lng}, ${end.lat}`)}
                                                    className="size-5 h-5 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Copy className="size-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "group relative flex flex-col gap-0.5 p-3 rounded-lg border transition-all duration-200",
                                            end 
                                                ? "bg-accent border-primary shadow-sm" 
                                                : "bg-muted border-dashed border-border"
                                        )}>
                                            <span className="text-[11px] font-mono font-semibold tracking-tight">
                                                {end ? `${end.lng.toFixed(5)}, ${end.lat.toFixed(5)}` : "Waiting for input..."}
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
