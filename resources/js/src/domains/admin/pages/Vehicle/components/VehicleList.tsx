import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Vehicle } from '../../../services/vehicleService';
import { Truck, Navigation, Filter, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface VehicleListProps {
    vehicles: Vehicle[];
    selectedId: string | null;
    onSelect: (vehicle: Vehicle) => void;
    isLoading?: boolean;
}

export const VehicleList = ({ 
    vehicles, 
    selectedId, 
    onSelect,
    isLoading 
}: VehicleListProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredVehicles = vehicles.filter(v => 
        v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="flex flex-col h-full shadow-none bg-transparent">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="size-4 text-primary" />
                    {t('fleet_status') || 'Fleet Status'}
                </CardTitle>
                <CardDescription className="text-xs">
                    {t('tracking_active_vehicles') || 'Tracking active vehicles and drivers'}
                </CardDescription>
                <div className="mt-3">
                    <SearchInput
                        placeholder={t('search_plate_or_driver') || 'Search plate or driver...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClear={() => setSearchTerm('')}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 px-4 pb-2">
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-2">
                        {filteredVehicles.length === 0 ? (
                            <div className="py-12 text-center space-y-2">
                                <div className="size-10 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground opacity-50">
                                    <Filter className="size-5" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">{t('system:no_markers_found')}</p>
                            </div>
                        ) : (
                            filteredVehicles.map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    onClick={() => onSelect(vehicle)}
                                    className={cn(
                                        'group flex flex-col gap-2 p-3 rounded-xl border border-border transition-all cursor-pointer animate-in fade-in slide-in-from-right-4 duration-300',
                                        selectedId === vehicle.id 
                                            ? 'bg-primary/5 border-primary/30 shadow-sm' 
                                            : 'bg-card dark:bg-card/90 hover:bg-accent/50 border-border/50'
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={cn(
                                                'size-2 rounded-full shrink-0',
                                                vehicle.is_active ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'
                                            )} />
                                            <span className="text-xs font-black uppercase tracking-wider font-mono truncate leading-tight">
                                                {vehicle.plate_number}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-bold uppercase shrink-0 border-none bg-muted/50">
                                            {t(`system:type_${vehicle.type}`)}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-0.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <User className="size-3 opacity-50" />
                                            <span className="truncate max-w-[80px]">
                                                {vehicle.driver?.name || t('system:unassigned')}
                                            </span>
                                        </div>
                                        {vehicle.latitude && vehicle.longitude && (
                                            <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground/60 italic">
                                                <Navigation className="size-2.5" />
                                                <span>Active</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
