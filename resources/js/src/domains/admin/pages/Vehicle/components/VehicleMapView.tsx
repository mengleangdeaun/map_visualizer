import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Vehicle } from '../../../services/vehicleService';
import { Map, MapMarker, MarkerContent, MarkerPopup, MarkerLabel, MapControls } from '@/components/ui/map';
import { Truck, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VehicleList } from './VehicleList';
import { Card } from '@/components/ui/card';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { MapLoading } from '@/components/shared/map/MapLoading';

interface VehicleMapViewProps {
    vehicles: Vehicle[];
    isLoading?: boolean;
    isFetching?: boolean;
}

const VehicleMapView = ({ vehicles, isLoading, isFetching }: VehicleMapViewProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [viewport, setViewport] = useState({
        center: [104.9282, 11.5564] as [number, number],
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    const validVehicles = useMemo(() => {
        return vehicles.filter(v => v.latitude && v.longitude);
    }, [vehicles]);

    // Center map on first location if available
    useEffect(() => {
        if (validVehicles.length > 0 && !selectedId) {
            const first = validVehicles[0];
            setViewport(prev => ({
                ...prev,
                center: [Number(first.longitude), Number(first.latitude)],
                zoom: 12
            }));
        }
    }, [validVehicles.length === 0]);

    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedId(vehicle.id);
        if (vehicle.latitude && vehicle.longitude) {
            setViewport({
                ...viewport,
                center: [Number(vehicle.longitude), Number(vehicle.latitude)],
                zoom: 15,
            });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[650px]">
            <Card className="lg:col-span-3 relative overflow-hidden rounded-xl p-0 shadow-sm h-full">
                {(isLoading || isFetching) && <MapLoading message={t('admin:updating_fleet') || 'Updating fleet...'} />}
                <Map 
                    viewport={viewport}
                    onViewportChange={setViewport}
                    className="h-full w-full"
                    language="km"
                >
                    <MapControls 
                        position="top-right" 
                        showLocate 
                        showCompass
                        onLocate={(pos) => setUserLocation([pos.longitude, pos.latitude])}
                    />

                    <UserLocationMarker coordinates={userLocation} />

                    {validVehicles.map((vehicle) => (
                        <MapMarker
                            key={vehicle.id}
                            longitude={vehicle.longitude!}
                            latitude={vehicle.latitude!}
                            anchor="bottom"
                        >
                            <MarkerContent>
                                <div 
                                    onClick={() => setSelectedId(vehicle.id)}
                                    className={cn(
                                        "group relative flex items-center justify-center h-10 w-10 rounded-full border-2 border-white shadow-xl transition-all hover:scale-110 cursor-pointer",
                                        vehicle.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                        selectedId === vehicle.id && "ring-4 ring-primary/20 scale-110"
                                    )}
                                >
                                    <Truck size={20} />
                                    {vehicle.is_active && (
                                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 animate-pulse shadow-sm" />
                                    )}
                                </div>
                            </MarkerContent>
                            
                            <MarkerLabel position="bottom" className="mt-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded shadow-sm border text-[9px] font-black uppercase tracking-tighter transition-colors",
                                    selectedId === vehicle.id ? "bg-primary text-primary-foreground border-primary" : "bg-background/90 backdrop-blur-sm"
                                )}>
                                    {vehicle.plate_number}
                                </span>
                            </MarkerLabel>

                            <MarkerPopup closeButton onClose={() => setSelectedId(null)}>
                                <div className="w-56 space-y-3 p-1">
                                    <div className="flex items-center gap-3 pb-2 border-b">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Truck size={22} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm leading-tight uppercase tracking-wide">{vehicle.plate_number}</span>
                                            <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 font-bold uppercase py-0 px-1 border-primary/20 bg-primary/5 text-primary">
                                                {t(`system:type_${vehicle.type}`)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">{t('system:driver')}:</span>
                                            <span className="font-semibold">{vehicle.driver?.name || t('system:unassigned')}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">{t('system:status')}:</span>
                                            <span className={cn(
                                                "font-bold uppercase tracking-widest text-[10px]",
                                                vehicle.is_active ? "text-green-600" : "text-destructive"
                                            )}>
                                                {vehicle.is_active ? t('system:active') : t('system:inactive')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex gap-2">
                                        <button className="flex-1 bg-primary text-primary-foreground h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-primary/90">
                                            <Navigation size={14} />
                                            {t('track') || 'Track'}
                                        </button>
                                    </div>
                                </div>
                            </MarkerPopup>
                        </MapMarker>
                    ))}
                </Map>
                
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md border rounded-lg px-3 py-2 shadow-lg z-10">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        {validVehicles.length} {t('vehicles_online') || 'Vehicles Active'}
                    </div>
                </div>
            </Card>

            <div className="lg:col-span-1 h-full min-h-0 bg-card border rounded-xl shadow-sm overflow-hidden">
                <VehicleList 
                    vehicles={vehicles} 
                    selectedId={selectedId} 
                    onSelect={handleSelectVehicle}
                />
            </div>
        </div>
    );
};

export default VehicleMapView;
