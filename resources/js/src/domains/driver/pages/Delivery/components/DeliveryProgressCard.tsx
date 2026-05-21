import React from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { DeliveryProgressCardProps } from '../types';

export const DeliveryProgressCard: React.FC<DeliveryProgressCardProps> = React.memo(({
    completedCount,
    totalStops,
    totalCod,
    t
}) => {
    // Calculate percentage ratio safely
    const progressPercent = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;

    return (
        <div className="p-5 border border-primary/10 shadow-md shadow-primary/5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex flex-col gap-4 select-none rounded-2xl relative overflow-hidden backdrop-blur-md">
            {/* Ambient Background Glow Spot */}
            <div className="absolute -top-10 -right-10 size-24 bg-primary/10 rounded-full blur-2xl" />

            <div className="flex items-center justify-between gap-4 z-10">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-primary animate-pulse" />
                        {t('route_progress') || 'Route Progress'}
                    </span>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-foreground tracking-tight">
                        {completedCount} <span className="text-sm font-bold text-gray-400">/ {totalStops} {t('stops_completed') || 'stops'}</span>
                    </h2>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t('expected_cod') || 'COD Balance'}
                    </span>
                    <div className="flex items-center gap-0.5 justify-end font-black text-2xl text-emerald-600 dark:text-emerald-500 font-sans">
                        <DollarSign size={20} className="text-emerald-500" strokeWidth={2.5} />
                        <span>{totalCod.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Premium Progress Bar */}
            <div className="space-y-1.5 z-10">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400">
                    <span className="text-primary font-extrabold">{progressPercent}% {t('completed') || 'Completed'}</span>
                    <span>{totalStops - completedCount} {t('remaining') || 'Remaining'}</span>
                </div>
                <div className="h-2 w-full bg-gray-200/50 dark:bg-gray-800/40 rounded-full overflow-hidden p-[1px] border border-gray-300/10">
                    <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
});

DeliveryProgressCard.displayName = 'DeliveryProgressCard';

