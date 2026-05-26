import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Truck, Power, Bike, Car, Navigation, Shield, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Vehicle } from '../../../services/driverShiftService';

interface ShiftControlProps {
    isOnline: boolean;
    activeVehicle: Vehicle | null;
    onStartTracking: () => void;
    onStopTracking: () => void;
    onSelectVehicle: () => void;
    onCheckOut: () => void;
    isLoading?: boolean;
}

export const ShiftControl = ({
    isOnline,
    activeVehicle,
    onStartTracking,
    onStopTracking,
    onSelectVehicle,
    onCheckOut,
    isLoading = false
}: ShiftControlProps) => {
    const { t } = useTranslation();

    // Helper to render vehicle type icon
    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'motorcycle':
                return <Bike size={36} className="text-primary-foreground" />;
            case 'minivan':
                return <Car size={36} className="text-primary-foreground" />;
            case 'tuktuk':
                return <Navigation size={36} className="text-primary-foreground rotate-45" />;
            case 'box_truck':
            default:
                return <Truck size={36} className="text-primary-foreground" />;
        }
    };

    // Helper to format vehicle type nicely
    const formatVehicleType = (type: string) => {
        return t(`vehicle_type_${type}`) || type.replace('_', ' ').toUpperCase();
    };

    return (
        <Card className={cn(
            "p-6 flex rounded-2xl flex-col items-center gap-6 transition-all duration-500 border-none relative overflow-hidden",
            isOnline ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
        )}>
            {/* Pulsing effect during active tracking */}
            {isOnline && (
                <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
            )}

            {/* Top Security/Trust Shield Badge */}
            <div className="absolute top-4 right-4 opacity-30">
                <Shield size={16} />
            </div>
            
            {/* Central Icon container */}
            <div className={cn(
                "h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner",
                isOnline ? "bg-white/10 scale-110 border border-white/20" : "bg-muted shadow-lg"
            )}>
                {activeVehicle ? (
                    <div className="flex flex-col items-center justify-center">
                        {isOnline ? (
                            getVehicleIcon(activeVehicle.type)
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center">
                                {React.cloneElement(getVehicleIcon(activeVehicle.type), { className: "text-muted-foreground" })}
                            </div>
                        )}
                    </div>
                ) : (
                    <Truck size={40} className="text-muted-foreground opacity-40" />
                )}
            </div>

            {/* Status Information */}
            <div className="text-center space-y-2 w-full px-2">
                <h2 className="text-2xl font-black tracking-tighter leading-none">
                    {isOnline 
                        ? t('shift_active') || 'Shift Active'
                        : activeVehicle 
                            ? t('ready_to_start') || 'Ready to Start?'
                            : t('no_vehicle') || 'No Vehicle Assigned'}
                </h2>
                
                <p className={cn(
                    "text-xs font-medium max-w-[280px] mx-auto leading-relaxed",
                    isOnline ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                    {isOnline 
                        ? t('location_broadcasting') || 'Your location and telemetry are being broadcasted to dispatch in real-time.'
                        : activeVehicle 
                            ? t('check_in_to_start') || 'Please check in to a vehicle to start tracking location and receiving tasks.'
                            : t('select_vehicle_desc') || 'Select a vehicle from your company fleet to start your operational shift.'}
                </p>

                {/* Assigned Vehicle Details Plate */}
                {activeVehicle && (
                    <div className={cn(
                        "mt-3 inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black tracking-wide border shadow-sm mx-auto",
                        isOnline 
                            ? "bg-white/10 border-white/20 text-white" 
                            : "bg-muted/80 border-border text-foreground"
                    )}>
                        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>{formatVehicleType(activeVehicle.type)}</span>
                        <span className="opacity-40">•</span>
                        <span className="font-mono bg-black/10 px-2 py-0.5 rounded uppercase tracking-wider">
                            {activeVehicle.plate_number}
                        </span>
                    </div>
                )}
            </div>

            {/* Primary Action Button */}
            <div className="w-full space-y-3">
                {activeVehicle ? (
                    <>
                        {isOnline ? (
                            <Button 
                                size="lg" 
                                onClick={onStopTracking}
                                disabled={isLoading}
                                variant="secondary"
                                className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest gap-2 active:scale-[0.98] transition-all"
                            >
                                <Power size={18} />
                                {t('end_shift') || 'End Shift'}
                            </Button>
                        ) : (
                            <Button 
                                size="lg" 
                                onClick={onStartTracking}
                                disabled={isLoading}
                                className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest gap-2 bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] transition-all"
                            >
                                <Power size={18} />
                                {t('start_shift') || 'Start Shift'}
                            </Button>
                        )}

                        {/* Check Out Option */}
                        {!isOnline && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onCheckOut}
                                disabled={isLoading}
                                className="w-full h-10 text-xs font-bold text-muted-foreground hover:text-destructive active:scale-[0.98] transition-all uppercase tracking-wider"
                            >
                                {t('check_out_vehicle') || 'Release Vehicle (Check-out)'}
                            </Button>
                        )}
                    </>
                ) : (
                    <Button 
                        size="lg" 
                        onClick={onSelectVehicle}
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest gap-2 shadow-xl bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] transition-all"
                    >
                        <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
                        {t('select_vehicle') || 'Select Vehicle'}
                    </Button>
                )}
            </div>
        </Card>
    );
};
