import React from 'react';
import { Button } from '@/components/ui/button';
import { Store, MapPin, ArrowUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSectionProps {
    pickup: [number, number] | null;
    pickupLabel: string;
    dropoff: [number, number] | null;
    dropoffLabel: string;
    isAnimating: boolean;
    onClearAll: () => void;
    onClearPickup: () => void;
    onClearDropoff: () => void;
    onSwap: () => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
    pickup, pickupLabel, dropoff, dropoffLabel, isAnimating,
    onClearAll, onClearPickup, onClearDropoff, onSwap
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logistics Path</label>
                {(pickup || dropoff) && !isAnimating && (
                    <button 
                        className="text-[10px] font-bold text-destructive hover:text-destructive uppercase tracking-wider transition-colors"
                        onClick={onClearAll}
                    >
                        Clear All
                    </button>
                )}
            </div>
            
            <div className="relative space-y-1.5">
                {/* Pickup */}
                <div className={cn(
                    "relative z-10 flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 group",
                    pickup 
                        ? "bg-white dark:bg-zinc-900 border-emerald-500/20 shadow-lg shadow-emerald-500/[0.02]" 
                        : "bg-muted/20 border-dashed border-muted-foreground/20"
                )}>
                    <div className={cn(
                        "size-5 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-all duration-500",
                        pickup 
                            ? "bg-emerald-500 border-emerald-100 dark:border-emerald-950 scale-110" 
                            : "bg-muted border-muted-foreground/20"
                    )} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Start Point</p>
                        <p className={cn(
                            "text-[13px] font-bold truncate transition-colors leading-relaxed",
                            pickup ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                            {pickupLabel}
                        </p>
                    </div>
                    {pickup && !isAnimating && (
                        <button onClick={onClearPickup} className="size-6 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                            <X className="size-3" />
                        </button>
                    )}
                </div>

                {/* Swap Button */}
                <div className="relative h-0 flex justify-center z-20">
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute -translate-y-1/2 size-8 rounded-full bg-background border-2 border-muted shadow-lg hover:border-emerald-500 hover:text-emerald-600 hover:scale-110 active:scale-90 transition-all duration-500 group/swap"
                        onClick={onSwap}
                        disabled={isAnimating || (!pickup && !dropoff)}
                    >
                        <ArrowUpDown className="size-3.5 transition-transform group-active/swap:scale-75" />
                    </Button>
                </div>

                {/* Dropoff */}
                <div className={cn(
                    "relative z-10 flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 group",
                    dropoff 
                        ? "bg-white dark:bg-zinc-900 border-emerald-600/20 shadow-lg shadow-emerald-600/[0.02]" 
                        : "bg-muted/20 border-dashed border-muted-foreground/20"
                )}>
                    <div className={cn(
                        "mt-1 size-5 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-all duration-500",
                        dropoff 
                            ? "bg-emerald-600 border-emerald-100 dark:border-emerald-950 scale-110" 
                            : "bg-muted border-muted-foreground/20"
                    )} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">End Destination</p>
                        <p className={cn(
                            "text-[13px] font-bold truncate transition-colors leading-relaxed",
                            dropoff ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                            {dropoffLabel}
                        </p>
                    </div>
                    {dropoff && !isAnimating && (
                        <button onClick={onClearDropoff} className="size-6 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                            <X className="size-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
