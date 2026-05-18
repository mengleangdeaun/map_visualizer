import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Bike, Car, Navigation, Truck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Vehicle } from '@/domains/driver/services/driverShiftService';

interface VehicleSelectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    vehicles: Vehicle[];
    onSelect: (vehicleId: string) => void;
    isLoading?: boolean;
}

export const VehicleSelectDialog = ({
    isOpen,
    onClose,
    vehicles,
    onSelect,
    isLoading = false
}: VehicleSelectDialogProps) => {
    const { t } = useTranslation(['driver', 'system']);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter vehicles based on search query
    const filteredVehicles = vehicles.filter(v => 
        v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to render vehicle type icon
    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'motorcycle':
                return <Bike size={20} className="text-muted-foreground" />;
            case 'minivan':
                return <Car size={20} className="text-muted-foreground" />;
            case 'tuktuk':
                return <Navigation size={20} className="text-muted-foreground rotate-45" />;
            case 'box_truck':
            default:
                return <Truck size={20} className="text-muted-foreground" />;
        }
    };

    // Helper to format vehicle type nicely
    const formatVehicleType = (type: string) => {
        return t(`vehicle_type_${type}`) || type.replace('_', ' ').toUpperCase();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-[92vw] rounded-3xl p-5 gap-4 border-none bg-background/95 backdrop-blur-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-black tracking-tight">
                        {t('select_vehicle') || 'Select Vehicle'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-medium">
                        {t('select_vehicle_desc') || 'Select a vehicle from your company fleet to start your shift.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Search Input bar */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                    <Input 
                        placeholder={t('search_plate_or_type') || 'Search plate number or type...'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-muted/50 border-none font-medium text-sm focus-visible:ring-primary/20"
                    />
                </div>

                {/* Vehicles list */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[250px] py-1">
                    {filteredVehicles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground gap-2">
                            <Truck size={32} className="opacity-20" />
                            <p className="text-xs font-semibold italic">
                                {t('no_vehicles_found') || 'No vehicles found'}
                            </p>
                        </div>
                    ) : (
                        filteredVehicles.map((vehicle) => {
                            const isAssignedToOther = vehicle.driver_id !== null;
                            
                            return (
                                <Card 
                                    key={vehicle.id}
                                    onClick={() => !isLoading && onSelect(vehicle.id)}
                                    className={cn(
                                        "p-3.5 flex items-center justify-between border border-border/40 hover:border-primary/30 bg-card hover:bg-primary/5 active:scale-[0.98] transition-all cursor-pointer rounded-2xl relative overflow-hidden group",
                                        isLoading && "pointer-events-none opacity-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 w-[78%]">
                                        <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {getVehicleIcon(vehicle.type)}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="text-sm font-black tracking-tight uppercase font-mono group-hover:text-primary transition-colors">
                                                {vehicle.plate_number}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                                {formatVehicleType(vehicle.type)}
                                            </span>
                                            
                                            {/* Warning if assigned to another operator */}
                                            {isAssignedToOther && (
                                                <div className="flex items-center gap-1 mt-1 text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide">
                                                    <AlertTriangle size={10} className="shrink-0" />
                                                    <span className="truncate">
                                                        {t('currently_assigned') || 'Assigned to another driver'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action indicators */}
                                    <div className="shrink-0">
                                        {isAssignedToOther ? (
                                            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] uppercase font-black tracking-wider py-0.5 px-2 rounded-lg">
                                                {t('override') || 'Override'}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] uppercase font-black tracking-wider py-0.5 px-2 rounded-lg">
                                                {t('available') || 'Available'}
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Cancel button */}
                <div className="pt-2 border-t flex justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="rounded-xl h-11 text-xs font-bold uppercase tracking-wider"
                    >
                        {t('cancel') || 'Cancel'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
