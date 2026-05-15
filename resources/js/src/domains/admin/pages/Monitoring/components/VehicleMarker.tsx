import React from 'react';
import { MapMarker, MarkerContent, MarkerPopup, MarkerLabel } from '@/components/ui/map';
import { Truck, Navigation, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Vehicle } from '../../../services/vehicleService';
import { useTranslation } from 'react-i18next';

interface VehicleMarkerProps {
    vehicle: Vehicle;
    isSelected?: boolean;
    onClick?: () => void;
}

export const VehicleMarker = ({ 
    vehicle, 
    isSelected, 
    onClick 
}: VehicleMarkerProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const lat = Number(vehicle.latitude);
    const lng = Number(vehicle.longitude);
    const speed = Number(vehicle.speed || 0);
    const maxSpeed = Number(vehicle.max_speed_kmh || 60);
    const isOverspeed = speed > maxSpeed;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

    return (
        <MapMarker
            longitude={lng}
            latitude={lat}
            anchor="bottom"
        >
            <MarkerContent>
                <div 
                    onClick={onClick}
                    className={cn(
                        "group relative flex items-center justify-center h-10 w-10 rounded-full border-2 border-white shadow-xl transition-all hover:scale-110 cursor-pointer",
                        vehicle.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        isOverspeed && "bg-destructive text-destructive-foreground animate-bounce shadow-destructive/50",
                        isSelected && "ring-4 ring-primary/30 scale-110 shadow-primary/20",
                        isSelected && isOverspeed && "ring-destructive/30 shadow-destructive/40"
                    )}
                >
                    <Truck size={20} className={cn(isOverspeed && "animate-pulse")} />
                    {isOverspeed && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-destructive animate-ping shadow-lg flex items-center justify-center">
                             <div className="size-1.5 rounded-full bg-white" />
                        </div>
                    )}
                    {vehicle.is_active && !isOverspeed && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 animate-pulse shadow-sm" />
                    )}
                    
                    <MarkerLabel position="bottom" className="mt-1">
                        <span className={cn(
                            "px-2 py-0.5 rounded shadow-sm border text-[9px] font-black uppercase tracking-tighter transition-all",
                            isOverspeed ? "bg-destructive text-destructive-foreground border-destructive shadow-lg" : "bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0",
                            isSelected 
                                ? "bg-primary text-primary-foreground border-primary scale-110 -translate-y-0.5 opacity-100" 
                                : ""
                        )}>
                            {isOverspeed ? `⚠️ ${speed} KM/H` : vehicle.plate_number}
                        </span>
                    </MarkerLabel>
                </div>
            </MarkerContent>

            <MarkerPopup className="p-0 border-none bg-transparent shadow-none overflow-visible">
                <div className={cn(
                    "w-64 overflow-hidden rounded-xl border border-border/50 bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                    isOverspeed && "border-destructive/50 ring-2 ring-destructive/20"
                )}>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b">
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                isOverspeed ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                            )}>
                                <Truck size={22} />
                            </div>
                            <div className="flex flex-1 flex-col min-w-0">
                                <span className="font-bold text-sm leading-tight uppercase tracking-wide truncate">{vehicle.plate_number}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="w-fit text-[9px] h-4 font-bold uppercase py-0 px-1.5 border-primary/20 bg-primary/5 text-primary">
                                        {t(`system:type_${vehicle.type}`)}
                                    </Badge>
                                    {isOverspeed && (
                                        <Badge variant="destructive" className="w-fit text-[9px] h-4 font-black uppercase py-0 px-1.5 animate-pulse">
                                            {t('admin:overspeed')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {/* Speed Telemetry */}
                            <div className={cn(
                                "p-2 rounded-lg border flex items-center justify-between transition-colors",
                                isOverspeed ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-dashed"
                            )}>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('admin:current_speed')}</span>
                                    <span className={cn("text-lg font-black leading-none", isOverspeed ? "text-destructive" : "text-foreground")}>
                                        {speed} <small className="text-[10px] font-bold">KM/H</small>
                                    </span>
                                </div>
                                <div className="h-8 w-[1px] bg-border/50 mx-1" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('admin:speed_limit')}</span>
                                    <span className="text-xs font-bold leading-none">{maxSpeed} KM/H</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User size={13} />
                                    <span>{t('system:driver')}</span>
                                </div>
                                <span className="font-semibold">{vehicle.driver?.name || t('system:unassigned')}</span>
                            </div>
                            
                            {vehicle.driver?.phone && (
                                <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone size={13} />
                                        <span>{t('system:phone')}</span>
                                    </div>
                                    <span className="font-mono">{vehicle.driver.phone}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-bold">{t('system:status')}</span>
                                <span className={cn(
                                    "font-black uppercase tracking-widest text-[10px]",
                                    vehicle.is_active ? "text-green-600" : "text-destructive"
                                )}>
                                    {vehicle.is_active ? t('system:active') : t('system:inactive')}
                                </span>
                            </div>
                        </div>

                        <div className="pt-1 flex gap-2">
                            <Button className={cn(
                                "flex-1 h-8 text-[10px] font-black uppercase tracking-widest gap-1.5",
                                isOverspeed && "bg-destructive hover:bg-destructive/90"
                            )}>
                                <Navigation size={13} />
                                {t('track') || 'Track'}
                            </Button>
                        </div>
                    </div>
                </div>
            </MarkerPopup>
        </MapMarker>
    );
};
