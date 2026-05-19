import React from 'react';
import { Map, MapControls, MapMarker, MarkerContent } from '@/components/ui/map';
import { RoadRoute } from '@/components/shared/map/RoadRoute';
import { Package, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Delivery } from '../../../services/deliveryService';
import { Route } from '../../../services/routeService';

interface DispatchMapProps {
    mapViewport: {
        center: [number, number];
        zoom: number;
        bearing: number;
        pitch: number;
    };
    setMapViewport: React.Dispatch<React.SetStateAction<{
        center: [number, number];
        zoom: number;
        bearing: number;
        pitch: number;
    }>>;
    unassignedDeliveries: Delivery[];
    activeRoute: Route | null;
    onPinClick: (delivery: Delivery) => void;
}

export const DispatchMap: React.FC<DispatchMapProps> = ({
    mapViewport,
    setMapViewport,
    unassignedDeliveries,
    activeRoute,
    onPinClick,
}) => {
    const stopCoords = activeRoute?.stops
        ?.filter(s => s.delivery?.dropoff_latitude && s.delivery?.dropoff_longitude)
        .map(s => [Number(s.delivery!.dropoff_longitude), Number(s.delivery!.dropoff_latitude)] as [number, number]) ?? [];

    return (
        <div className="relative flex flex-col min-h-0 h-full w-full">
            <Map
                viewport={mapViewport}
                onViewportChange={setMapViewport}
                className="h-full w-full"
                language="km"
            >
                <MapControls position="top-right" showCompass />

                {/* Unassigned delivery pins */}
                {unassignedDeliveries.map(delivery => {
                    if (!delivery.dropoff_latitude || !delivery.dropoff_longitude) return null;
                    const alreadyInRoute = activeRoute?.stops?.some(s => s.delivery_id === delivery.id);
                    if (alreadyInRoute) return null;

                    return (
                        <MapMarker
                            key={delivery.id}
                            longitude={Number(delivery.dropoff_longitude)}
                            latitude={Number(delivery.dropoff_latitude)}
                            onClick={() => onPinClick(delivery)}
                        >
                            <MarkerContent>
                                <div className="cursor-pointer group relative -top-5 flex flex-col items-center">
                                    <div className="size-7 rounded-full bg-slate-700 border-2 border-background shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:bg-primary group-hover:border-primary-foreground group-hover:shadow-primary/50">
                                        <Package className="size-3.5 text-white" />
                                    </div>
                                    <div className="absolute top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-md shadow-2xl border border-border whitespace-nowrap z-50 pointer-events-none">
                                        {delivery.order?.customer?.name ?? delivery.tracking_number}
                                    </div>
                                </div>
                            </MarkerContent>
                        </MapMarker>
                    );
                })}

                {/* Active route's assigned stop pins */}
                {activeRoute?.stops?.map(stop => {
                    if (!stop.delivery?.dropoff_latitude || !stop.delivery?.dropoff_longitude) return null;
                    return (
                        <MapMarker
                            key={stop.id}
                            longitude={Number(stop.delivery.dropoff_longitude)}
                            latitude={Number(stop.delivery.dropoff_latitude)}
                        >
                            <MarkerContent>
                                <div className="relative -top-5 flex flex-col items-center">
                                    <div className={cn(
                                        'size-8 rounded-full border-2 border-background shadow-xl flex items-center justify-center font-black text-white text-xs transition-all duration-300 transform scale-110 hover:scale-125',
                                        stop.status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/40' :
                                        stop.status === 'skipped'   ? 'bg-rose-500 shadow-rose-500/40' :
                                        stop.status === 'arrived'   ? 'bg-amber-500 shadow-amber-500/40' : 'bg-primary shadow-primary/40'
                                    )}>
                                        {stop.sequence_number}
                                    </div>
                                </div>
                            </MarkerContent>
                        </MapMarker>
                    );
                })}

                {/* Road paths connecting route stops */}
                {stopCoords.length >= 2 && stopCoords.map((coord, i) => {
                    if (i === 0) return null;
                    return (
                        <RoadRoute
                            key={i}
                            from={stopCoords[i - 1]}
                            to={coord}
                            color="#3b82f6" // Primary theme accent color
                            width={4}
                        />
                    );
                })}
            </Map>

            {/* Premium Legend card overlay */}
            <div className="absolute bottom-4 left-4 dark:bg-gradient-to-t from-card to-background bg-background/95 backdrop-blur-md border border-border rounded-2xl p-3 shadow-2xl text-[11px] space-y-2.5 max-w-[260px]">
                <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Map Indicators</span>
                <div className="flex items-center gap-3">
                    <div className="size-5 rounded-full bg-slate-700 border border-border shadow-sm flex items-center justify-center">
                        <Package className="size-3 text-white" />
                    </div>
                    <span className="text-muted-foreground font-semibold">Unassigned (Click to add)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-5 rounded-full bg-primary border border-background shadow-sm flex items-center justify-center text-[9px] text-primary-foreground font-black">1</div>
                    <span className="text-muted-foreground font-semibold">Route Sequence Stop</span>
                </div>
            </div>
        </div>
    );
};
