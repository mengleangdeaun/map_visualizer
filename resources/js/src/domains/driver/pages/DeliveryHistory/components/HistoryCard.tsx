import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HistoricalRoute } from '../types';
import { 
    Calendar, 
    MapPin, 
    Truck, 
    Clock, 
    DollarSign, 
    ListChecks, 
    CheckCircle2, 
    XCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryCardProps {
    route: HistoricalRoute;
    onViewStops: (route: HistoricalRoute) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ route, onViewStops }) => {
    const { t } = useTranslation(['driver', 'delivery']);

    const formattedDate = new Date(route.date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Compute stops distribution
    const totalStops = route.stops.length;
    const completedStops = route.stops.filter(s => s.status === 'completed').length;
    const skippedStops = route.stops.filter(s => s.status === 'skipped').length;
    const pendingStops = route.stops.filter(s => !['completed', 'skipped'].includes(s.status)).length;

    // Calculate actual COD cash collected successfully (only for completed stops)
    const codCollected = route.stops.reduce((acc, stop) => {
        if (stop.status === 'completed' && stop.delivery?.order) {
            const order = stop.delivery.order;
            if (order.payment_method === 'cod') {
                return acc + (order.amount_due_cod || 0);
            }
        }
        return acc;
    }, 0);

    return (
        <Card 
            onClick={() => onViewStops(route)}
            className="p-4 border-none shadow-md bg-white hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer rounded-2xl flex flex-col gap-3 select-none"
        >
            {/* Header: Date & Status Badge */}
            <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="size-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <Calendar size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
                            {t('driver:route_date') || 'Route Run'}
                        </span>
                        <span className="text-xs font-black text-gray-800 leading-none">
                            {formattedDate}
                        </span>
                    </div>
                </div>

                <Badge className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                    route.status === 'completed' 
                        ? "bg-emerald-500/10 text-emerald-600" 
                        : "bg-amber-500/10 text-amber-600"
                )}>
                    {route.status === 'completed' ? (t('driver:completed') || 'Completed') : (t('driver:in_progress') || 'Active')}
                </Badge>
            </div>

            {/* Hub and Route Stats Row */}
            <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100/60">
                {route.hub && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
                        <MapPin size={13} className="text-green-600 shrink-0" />
                        <span className="font-bold truncate text-[11px]">{route.hub.code} • {route.hub.name}</span>
                    </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* Weight */}
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase text-gray-400 tracking-wider">
                            {t('delivery:total_weight') || 'Cargo Cargo'}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-black text-gray-700 mt-0.5">
                            <Truck size={12} className="text-gray-400" />
                            <span>{route.total_weight_kg} kg</span>
                        </div>
                    </div>
                    
                    {/* Distance */}
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase text-gray-400 tracking-wider">
                            {t('delivery:est_distance') || 'Distance'}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-black text-gray-700 mt-0.5">
                            <Clock size={12} className="text-gray-400" />
                            <span>{route.estimated_distance_km} km</span>
                        </div>
                    </div>

                    {/* Est Duration */}
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase text-gray-400 tracking-wider">
                            {t('delivery:est_duration') || 'Duration'}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-black text-gray-700 mt-0.5">
                            <Clock size={12} className="text-gray-400" />
                            <span>{route.estimated_duration_min}m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Stops Execution Ratio & COD Counter */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                {/* Stops resolved indicators */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black text-[10px] tracking-wide">
                        <CheckCircle2 size={10} />
                        <span>{completedStops}</span>
                    </div>
                    {skippedStops > 0 && (
                        <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded font-black text-[10px] tracking-wide">
                            <XCircle size={10} />
                            <span>{skippedStops}</span>
                        </div>
                    )}
                    {pendingStops > 0 && (
                        <div className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-black text-[10px] tracking-wide">
                            <ListChecks size={10} />
                            <span>{pendingStops}</span>
                        </div>
                    )}
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        / {totalStops} {t('delivery:stops') || 'stops'}
                    </span>
                </div>

                {/* COD collected balance */}
                <div className="text-right">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                        {t('delivery:cod_remitted') || 'COD Collected'}
                    </span>
                    <div className="flex items-center gap-0.5 text-xs font-black text-emerald-600 justify-end mt-0.5">
                        <DollarSign size={13} strokeWidth={2.5} />
                        <span>{codCollected.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
