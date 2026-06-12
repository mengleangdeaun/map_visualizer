import React, { useState, useRef, useEffect } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search, Bike, Car, Navigation, Truck, AlertTriangle,
    ChevronRight, Loader2,
} from 'lucide-react';
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

// ─── Vehicle type helpers ────────────────────────────────────────────────────

const VEHICLE_META: Record<string, {
    icon: React.ReactNode;
    label: string;
    color: string;
}> = {
    motorcycle: {
        icon: <Bike size={22} />,
        label: 'Motorcycle',
        color: 'from-blue-500/20 to-indigo-500/10 text-blue-500',
    },
    minivan: {
        icon: <Car size={22} />,
        label: 'Minivan',
        color: 'from-violet-500/20 to-purple-500/10 text-violet-500',
    },
    tuktuk: {
        icon: <Navigation size={22} className="rotate-45" />,
        label: 'Tuk-tuk',
        color: 'from-amber-500/20 to-orange-500/10 text-amber-600',
    },
    box_truck: {
        icon: <Truck size={22} />,
        label: 'Box Truck',
        color: 'from-emerald-500/20 to-teal-500/10 text-emerald-600',
    },
};

const getVehicleMeta = (type: string) => VEHICLE_META[type] ?? VEHICLE_META['box_truck'];

// ─── Component ───────────────────────────────────────────────────────────────

export const VehicleSelectDialog = ({
    isOpen,
    onClose,
    vehicles,
    onSelect,
    isLoading = false,
}: VehicleSelectDialogProps) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Clear selection & search on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedId(null);
        }
    }, [isOpen]);

    const filteredVehicles = vehicles.filter(v =>
        v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (vehicleId: string) => {
        if (isLoading) return;
        setSelectedId(vehicleId);
        onSelect(vehicleId);
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent>
                {/* ── Header ─────────────────────────────────── */}
                <DrawerHeader>
                    <DrawerTitle>
                        {t('select_vehicle') || 'Select a Vehicle'}
                    </DrawerTitle>
                    <DrawerDescription>
                        {t('select_vehicle_desc') || 'Choose a vehicle from your company fleet to begin your shift.'}
                    </DrawerDescription>
                </DrawerHeader>

                {/* ── Search ─────────────────────────────────── */}
                <div className="px-5 pb-3">
                    <div className="relative">
                        <Search
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
                        />
                        <Input
                            ref={searchRef}
                            id="vehicle-search"
                            placeholder={t('search_plate_or_type') || 'Search plate or vehicle type…'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 rounded-2xl bg-muted/60 border-none text-sm font-medium focus-visible:ring-0"
                        />
                    </div>
                </div>

                {/* ── Vehicle list ────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-2.5 pb-2" style={{ maxHeight: '50dvh' }}>
                    {filteredVehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
                            <Truck size={36} className="opacity-15" />
                            <p className="text-xs font-semibold italic">
                                {searchQuery
                                    ? t('no_vehicles_match') || 'No vehicles match your search.'
                                    : t('no_vehicles_found') || 'No vehicles available.'}
                            </p>
                        </div>
                    ) : (
                        filteredVehicles.map((vehicle) => {
                            const meta = getVehicleMeta(vehicle.type);
                            const isAssignedToOther = vehicle.driver_id !== null;
                            const isSelected = selectedId === vehicle.id;
                            const isPicking = isSelected && isLoading;

                            return (
                                <button
                                    key={vehicle.id}
                                    id={`vehicle-option-${vehicle.id}`}
                                    onClick={() => handleSelect(vehicle.id)}
                                    disabled={isLoading}
                                    className={cn(
                                        // Base
                                        "w-full text-left rounded-2xl border transition-all duration-150",
                                        "flex items-center gap-3.5 p-3.5",
                                        "active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none",
                                        // Default
                                        "bg-card border-border/40 hover:border-primary/30 hover:bg-primary/5",
                                        // Selected / loading state
                                        isSelected && "border-primary/50 bg-primary/8 shadow-sm",
                                    )}
                                >
                                    {/* Vehicle icon blob */}
                                    <div className={cn(
                                        "size-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-all",
                                        meta.color,
                                    )}>
                                        {isPicking
                                            ? <Loader2 size={20} className="animate-spin opacity-70" />
                                            : meta.icon}
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-black tracking-tight uppercase font-mono leading-none">
                                                {vehicle.plate_number}
                                            </span>
                                            {isAssignedToOther ? (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] uppercase font-black tracking-wider py-0 px-1.5 h-4 rounded-md"
                                                >
                                                    {t('override') || 'Override'}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] uppercase font-black tracking-wider py-0 px-1.5 h-4 rounded-md"
                                                >
                                                    {t('available') || 'Available'}
                                                </Badge>
                                            )}
                                        </div>

                                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                                            {t(`vehicle_type_${vehicle.type}`) || meta.label}
                                        </span>

                                        {isAssignedToOther && (
                                            <div className="flex items-center gap-1 mt-1 text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide">
                                                <AlertTriangle size={9} className="shrink-0" />
                                                <span>
                                                    {t('currently_assigned') || 'Assigned to another driver'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chevron / spinner */}
                                    <div className="shrink-0 text-muted-foreground/40">
                                        {isPicking
                                            ? null
                                            : <ChevronRight size={16} />
                                        }
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────── */}
                <DrawerFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-12 rounded-2xl bg-muted/50 text-sm font-bold uppercase tracking-wider w-full border-none"
                    >
                        {t('cancel') || 'Cancel'}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
