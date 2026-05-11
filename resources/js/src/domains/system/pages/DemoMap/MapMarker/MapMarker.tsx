import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerLabel } from '@/components/ui/map';
import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { MapPin, Navigation, Info, Search, Filter, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';

interface MarkerData {
    id: number;
    lng: number;
    lat: number;
    title: string;
    description: string;
    type: 'hospital' | 'restaurant' | 'park' | 'other';
}

const initialMarkers: MarkerData[] = [
    { id: 1, lng: 104.88362845542673, lat: 11.564134606461863, title: 'Phnom Penh City Center', description: 'Central business district', type: 'other' },
    { id: 2, lng: 104.9120305870781, lat: 11.558576999146839, title: 'Olympic Market', description: 'Famous local market', type: 'other' },
    { id: 3, lng: 104.922, lat: 11.562, title: 'Royal Palace', description: 'Historical landmark', type: 'other' },
];

const typeColors = {
    hospital: 'bg-red-500',
    restaurant: 'bg-orange-500',
    park: 'bg-green-500',
    other: 'bg-primary',
};

const MapMarkerDemo = () => {
    const [viewport, setViewport] = useState({
        center: [104.88362845542673, 11.564134606461863] as [number, number],
        zoom: 13,
        bearing: 0,
        pitch: 0,
    });

    const [markers, setMarkers] = useState<MarkerData[]>(initialMarkers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const isInteractingWithMarker = useRef(false);

    const filteredMarkers = markers.filter((m) => m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleMapClick = (e: any) => {
        if (isInteractingWithMarker.current) {
            isInteractingWithMarker.current = false;
            return;
        }

        const { lng, lat } = e.lngLat;
        const newMarker: MarkerData = {
            id: Date.now(),
            lng,
            lat,
            title: `New Point ${markers.length + 1}`,
            description: 'Custom added point',
            type: 'other',
        };
        setMarkers([...markers, newMarker]);
    };

    const deleteMarker = (id: number) => {
        setMarkers(markers.filter((m) => m.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            <PageHeader title="Map Marker Management" subtitle="Add, delete, and explore custom locations with rich popups." />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 h-full relative rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Map viewport={viewport} onViewportChange={setViewport} onClick={handleMapClick} className="h-full w-full" language="km">
                        <MapControls position="top-right" showLocate onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])} />

                        <UserLocationMarker coordinates={userLocation} />

                        {filteredMarkers.map((marker) => (
                            <MapMarker
                                key={marker.id}
                                longitude={marker.lng}
                                latitude={marker.lat}
                                onClick={() => {
                                    isInteractingWithMarker.current = true;
                                    setSelectedId(marker.id);
                                }}
                            >
                                <MarkerContent>
                                    <div className="relative group/marker cursor-pointer">
                                        {selectedId === marker.id && <div className="absolute inset-0 -m-2 rounded-full bg-primary/20 animate-ping opacity-75" />}
                                        <div
                                            className={cn(
                                                'relative size-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300 group-hover/marker:scale-110',
                                                typeColors[marker.type],
                                                selectedId === marker.id && 'ring-4 ring-primary/30 scale-110',
                                            )}
                                        >
                                            <div className={cn('size-1.5 rounded-full bg-white transition-transform duration-300', selectedId === marker.id ? 'scale-150' : 'scale-100')} />
                                        </div>
                                    </div>
                                    <MarkerLabel
                                        position="top"
                                        className={cn(
                                            'transition-all duration-300 pointer-events-none',
                                            selectedId === marker.id
                                                ? 'opacity-100 -translate-y-1 font-bold text-primary bg-card dark:text-white shadow-xl px-2 py-0.5 rounded scale-110'
                                                : 'opacity-0 translate-y-2 group-hover/marker:opacity-100 group-hover/marker:translate-y-0',
                                        )}
                                    >
                                        {marker.title}
                                    </MarkerLabel>
                                </MarkerContent>
                                <MarkerPopup className="p-0 border-none bg-transparent shadow-none overflow-visible">
                                    <div className="w-[220px] overflow-hidden rounded-xl border bg-background shadow-2xl transition-transform active:scale-95">
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1 min-w-0">
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-wider bg-muted/50 border-none">
                                                        {marker.type}
                                                    </Badge>
                                                    <h4 className="font-bold text-sm leading-tight truncate text-foreground/90">{marker.title}</h4>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMarker(marker.id);
                                                    }}
                                                    className="size-6 -mr-1 -mt-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0 transition-all active:scale-90"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>

                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">{marker.description}</p>

                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-[10px] font-mono text-muted-foreground transition-colors hover:bg-muted/50 group/coords">
                                                    <Navigation className="size-3 shrink-0 text-primary opacity-60 group-hover/coords:opacity-100 transition-opacity" />
                                                    <span className="truncate">
                                                        {marker.lng.toFixed(6)}, {marker.lat.toFixed(6)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </MarkerPopup>
                            </MapMarker>
                        ))}
                    </Map>

                    <div className="absolute bottom-4 left-4 pointer-events-none">
                        <div className="bg-background/70 backdrop-blur-md p-3 rounded-lg border shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Plus className="size-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Quick Add</span>
                                <span className="text-xs text-muted-foreground font-medium">Click anywhere on the map</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-full">
                    <Card className="flex flex-col flex-1 min-h-0">
                        <CardHeader>
                            <CardTitle className="text-lg">Saved Locations</CardTitle>
                            <CardDescription>Manage your map markers</CardDescription>
                            <div className="relative mt-2">
                                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input placeholder="Search markers..." className="pl-9 h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 pt-0 px-0">
                            <ScrollArea className="h-full">
                                <div className="space-y-3 py-4 px-4">
                                    {filteredMarkers.length === 0 ? (
                                        <div className="py-8 text-center space-y-2">
                                            <div className="size-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                                                <Filter className="size-6" />
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">No markers found</p>
                                        </div>
                                    ) : (
                                        filteredMarkers.map((marker) => (
                                            <div
                                                key={marker.id}
                                                onClick={() => {
                                                    setSelectedId(marker.id);
                                                    setViewport({
                                                        ...viewport,
                                                        center: [marker.lng, marker.lat],
                                                        zoom: 15,
                                                    });
                                                }}
                                                className={cn(
                                                    'group flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                                                    selectedId === marker.id ? 'bg-accent border-primary/30 ring-1 ring-primary/20' : 'bg-card hover:bg-accent/50',
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('size-2.5 rounded-full', typeColors[marker.type])} />
                                                        <span className="text-xs font-bold truncate max-w-[120px]">{marker.title}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteMarker(marker.id);
                                                        }}
                                                        className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                        {marker.lng.toFixed(3)}, {marker.lat.toFixed(3)}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                        {marker.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed shrink-0">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <Info className="size-4 text-primary" />
                                Usage
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-[11px] space-y-2 text-muted-foreground font-medium leading-relaxed">
                                <li className="flex gap-2">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                    Click map to add markers
                                </li>
                                <li className="flex gap-2">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                    Click markers to see popups
                                </li>
                                <li className="flex gap-2">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                    Search and jump to locations
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MapMarkerDemo;
