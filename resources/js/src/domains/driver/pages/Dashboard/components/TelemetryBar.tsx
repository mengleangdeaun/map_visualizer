import React from 'react';
import { cn } from '@/lib/utils';
import { Gauge, Navigation, Wifi, WifiOff } from 'lucide-react';
import type { GpsAccuracy, CompassDirection } from '../../../types/telemetry.types';

interface TelemetryBarProps {
    isTracking: boolean;
    speedKmh: number;
    compass: CompassDirection;
    accuracy: GpsAccuracy;
    className?: string;
}

const ACCURACY_CONFIG: Record<GpsAccuracy, { label: string; color: string }> = {
    excellent: { label: 'GPS ✦', color: 'text-emerald-500' },
    good:      { label: 'GPS ✦', color: 'text-green-400' },
    fair:      { label: 'GPS ~', color: 'text-amber-400' },
    poor:      { label: 'GPS ⚠', color: 'text-red-400' },
    unknown:   { label: 'GPS', color: 'text-muted-foreground' },
};

export const TelemetryBar = ({
    isTracking,
    speedKmh,
    compass,
    accuracy,
    className,
}: TelemetryBarProps) => {
    const accConfig = ACCURACY_CONFIG[accuracy];

    if (!isTracking) return null;

    return (
        <div className={cn(
            "border-none rounded-lg bg-white px-4 py-3",
            "flex items-center justify-between gap-2 overflow-x-auto",
            "animate-in fade-in slide-in-from-top-2 duration-500",
            className
        )}>
            {/* Speed */}
            <Tile
                icon={<Gauge size={13} className="text-blue-500" />}
                label="Speed"
                value={<><span className="text-base font-black">{speedKmh}</span><span className="text-[10px] font-bold text-muted-foreground ml-0.5">km/h</span></>}
            />

            {/* Compass */}
            <Divider />
            <Tile
                icon={<Navigation size={13} className="text-indigo-500" />}
                label="Heading"
                value={<span className="text-base font-black">{compass}</span>}
            />

            {/* GPS quality */}
            <Divider />
            <Tile
                icon={isTracking
                    ? <Wifi size={13} className={accConfig.color} />
                    : <WifiOff size={13} className="text-muted-foreground" />
                }
                label="Signal"
                value={<span className={cn("text-base font-black", accConfig.color)}>{accConfig.label}</span>}
            />
        </div>
    );
};

// ─── Micro-components ────────────────────────────────────────────────────────

const Tile = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}) => (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
        <div className="flex items-center gap-1 text-muted-foreground">
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
        </div>
        <div className="flex items-baseline">{value}</div>
    </div>
);

const Divider = () => (
    <div className="h-8 w-px bg-border/50 shrink-0" />
);
