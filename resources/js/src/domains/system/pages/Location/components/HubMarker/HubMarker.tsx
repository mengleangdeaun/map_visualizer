import React from 'react';
import { MapMarker, MarkerContent, MarkerPopup, MarkerLabel } from '@/components/ui/map';
import { Warehouse, Edit, Trash2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Location } from '@/domains/fleet/services/locationService';
import { useTranslation } from 'react-i18next';
import { PushPin, MapLabel } from '@/components/shared/map/BaseMarker';

interface HubMarkerProps {
    location: Location;
    isSelected?: boolean;
    onClick?: () => void;
    onEdit?: (location: Location) => void;
    onDelete?: (location: Location) => void;
}

const typeColors = {
    main_sort: 'bg-blue-500',
    regional_hub: 'bg-purple-500',
    local_node: 'bg-orange-500',
};

export const HubMarker = ({ 
    location, 
    isSelected, 
    onClick, 
    onEdit, 
    onDelete 
}: HubMarkerProps) => {
    const { t } = useTranslation('system');
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);

    if (isNaN(lat) || isNaN(lng)) return null;

    return (
        <MapMarker
            longitude={lng}
            latitude={lat}
            onClick={onClick}
        >
            <MarkerContent>
                <div className="relative group/marker cursor-pointer">
                    <PushPin 
                        color={typeColors[location.type as keyof typeof typeColors] || 'bg-primary'}
                        isFocused={isSelected}
                    >
                        <Warehouse className="size-4 text-white" strokeWidth={2} />
                    </PushPin>
                    
                    <MarkerLabel
                        position="top"
                        className="mb-1"
                    >
                        <MapLabel isFocused={isSelected}>
                            {location.name}
                        </MapLabel>
                    </MarkerLabel>
                </div>
            </MarkerContent>

            <MarkerPopup className="p-0 border-none bg-transparent shadow-none overflow-visible">
                <div className="w-[240px] overflow-hidden rounded-xl border border-border/50 bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "text-[9px] h-4 px-1.5 font-bold uppercase tracking-wider border-none",
                                        location.type === 'main_sort' && "bg-blue-500/10 text-blue-600",
                                        location.type === 'regional_hub' && "bg-purple-500/10 text-purple-600",
                                        location.type === 'local_node' && "bg-orange-500/10 text-orange-600"
                                    )}
                                >
                                    {t(`type_${location.type}`)}
                                </Badge>
                                <h4 className="font-bold text-sm leading-tight truncate text-foreground/90">{location.name}</h4>
                                <p className="text-[10px] text-muted-foreground font-mono truncate">{location.code}</p>
                            </div>
                            
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit?.(location);
                                    }}
                                    className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
                                >
                                    <Edit className="size-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.(location);
                                    }}
                                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all active:scale-90"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-[10px] font-mono text-muted-foreground transition-colors hover:bg-muted/50 group/coords">
                                <Navigation className="size-3 shrink-0 text-primary opacity-60 group-hover/coords:opacity-100 transition-opacity" />
                                <span className="truncate">
                                    {lat.toFixed(6)}, {lng.toFixed(6)}
                                </span>
                            </div>
                            
                            {location.company && (
                                <div className="text-[11px] font-medium text-muted-foreground px-1">
                                    {t('company')}: <span className="text-foreground/80">{location.company.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </MarkerPopup>
        </MapMarker>
    );
};
