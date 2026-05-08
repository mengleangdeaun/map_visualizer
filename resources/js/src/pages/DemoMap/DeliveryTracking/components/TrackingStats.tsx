import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Navigation } from 'lucide-react';

interface TrackingStatsProps {
    isAnimating: boolean;
    status: string;
    progress: number;
    eta: number;
    distance: number;
    totalDuration: number;
    formatDuration: (mins: number) => string;
}

export const TrackingStats: React.FC<TrackingStatsProps> = ({
    isAnimating, status, progress, eta, distance, totalDuration, formatDuration
}) => {
    if (!isAnimating && status !== 'Delivered') {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="size-20 rounded-full bg-emerald-500/5 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                    <Navigation className="size-10 animate-pulse" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">Engine Ready</p>
                    <p className="text-xs text-muted-foreground px-8 leading-relaxed font-medium">
                        Configure your pickup and dropoff points to calculate the optimal route.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Live Progress</p>
                        <p className="text-xl font-bold">{progress}%</p>
                    </div>
                    <div className="flex flex-col items-end space-y-0.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Est. Completion</p>
                        <p className="text-xs font-bold">{formatDuration(eta)} remaining</p>
                    </div>
                </div>
                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden p-0.5 border border-muted">
                    <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-1 group hover:bg-emerald-500/[0.05] transition-colors">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Distance</p>
                    <p className="text-lg font-bold text-emerald-600">{distance.toFixed(2)}<span className="text-xs ml-1 font-bold text-muted-foreground/60">KM</span></p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-1 group hover:bg-emerald-500/[0.05] transition-colors">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Est. Duration</p>
                    <p className="text-lg font-bold text-emerald-600">{totalDuration}<span className="text-xs ml-1 font-bold text-muted-foreground/60">MIN</span></p>
                </div>
            </div>
        </div>
    );
};
