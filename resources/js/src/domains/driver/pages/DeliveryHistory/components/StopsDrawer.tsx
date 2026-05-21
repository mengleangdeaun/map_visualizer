import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../../components/BottomSheet';
import { HistoricalRoute, HistoricalStop } from '../types';
import { 
    Clock, 
    MapPin, 
    User, 
    Package, 
    FileText, 
    Image, 
    CheckCircle2, 
    XCircle, 
    DollarSign,
    Milestone,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StopsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    route: HistoricalRoute | null;
}

export const StopsDrawer: React.FC<StopsDrawerProps> = ({ isOpen, onClose, route }) => {
    const { t } = useTranslation(['driver', 'delivery']);

    if (!route) return null;

    const formattedDate = new Date(route.date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return '';
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (startStr?: string | null, endStr?: string | null) => {
        if (!startStr || !endStr) return '';
        const start = new Date(startStr).getTime();
        const end = new Date(endStr).getTime();
        const diffMs = end - start;
        if (diffMs <= 0) return '';
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        if (mins > 0) {
            return `${mins} min`;
        }
        return `${totalSecs} sec`;
    };

    const isSingleStop = route.stops && route.stops.length === 1;

    return (
        <BottomSheet 
            isOpen={isOpen} 
            onClose={onClose} 
            className={cn(
                "flex flex-col gap-0 p-0 overflow-hidden rounded-t-[32px]",
                isSingleStop ? "h-auto max-h-[85vh]" : "h-[85vh] max-h-[85vh]"
            )}
        >
            {/* Drawer Header */}
            <div className="pt-6 px-4 pb-4 border-b shrink-0 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Milestone size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
                                {t('driver:route_run_timeline') || 'Route Details'}
                            </span>
                            <h2 className="text-sm font-black text-gray-800 leading-tight">
                                {formattedDate}
                            </h2>
                        </div>
                    </div>

                    <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border-none",
                        route.status === 'completed' 
                            ? "bg-emerald-500/10 text-emerald-600" 
                            : "bg-amber-500/10 text-amber-600"
                    )}>
                        {route.status === 'completed' ? (t('driver:completed') || 'Completed') : (t('driver:in_progress') || 'Active')}
                    </Badge>
                </div>

                {/* Sub-header route stats */}
                <div className="flex items-center justify-between mt-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-500">
                    <div>
                        {t('delivery:stops') || 'Stops'}: <span className="text-gray-800 font-extrabold">{route.stop_count}</span>
                    </div>
                    <div>
                        {t('delivery:distance') || 'Distance'}: <span className="text-gray-800 font-extrabold">{route.estimated_distance_km} km</span>
                    </div>
                    <div>
                        {t('delivery:duration') || 'Duration'}: <span className="text-gray-800 font-extrabold">{route.estimated_duration_min} min</span>
                    </div>
                    <div>
                        {t('delivery:weight') || 'Weight'}: <span className="text-gray-800 font-extrabold">{route.total_weight_kg} kg</span>
                    </div>
                </div>
            </div>

            {/* Stops Timeline List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                {route.stops && route.stops.length > 0 ? (
                    route.stops
                        .sort((a, b) => a.sequence_number - b.sequence_number)
                        .map((stop, index) => {
                            const isCompleted = stop.status === 'completed';
                            const isSkipped = stop.status === 'skipped';
                            const dl = stop.delivery;
                            const order = dl?.order;
                            const customer = order?.customer;
                            const pod = dl?.proof_of_delivery;

                            return (
                                <div key={stop.id} className="flex gap-3 items-start relative group">
                                    {/* Vertical Connecting Line */}
                                    {index < route.stops.length - 1 && (
                                        <span className="absolute left-[15px] top-[32px] bottom-[-24px] w-0.5 bg-gray-200" />
                                    )}

                                    {/* Timeline Marker Circle */}
                                    <div className={cn(
                                        "size-8 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs border-4 border-white shadow-sm z-10",
                                        isCompleted 
                                            ? "bg-emerald-500 text-white" 
                                            : isSkipped 
                                                ? "bg-red-500 text-white" 
                                                : "bg-gray-400 text-white"
                                    )}>
                                        {stop.sequence_number}
                                    </div>

                                    {/* Stop Content Card */}
                                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                                        {/* Status Header */}
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <div className="flex items-center gap-1.5">
                                                {isCompleted ? (
                                                    <CheckCircle2 size={13} className="text-emerald-500" />
                                                ) : isSkipped ? (
                                                    <XCircle size={13} className="text-red-500" />
                                                ) : (
                                                    <Clock size={13} className="text-gray-400" />
                                                )}
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider",
                                                    isCompleted 
                                                        ? "text-emerald-500" 
                                                        : isSkipped 
                                                            ? "text-red-500" 
                                                            : "text-gray-500"
                                                )}>
                                                    {stop.status === 'completed' 
                                                        ? (t('driver:delivered') || 'Delivered') 
                                                        : stop.status === 'skipped' 
                                                            ? (t('driver:skipped') || 'Skipped') 
                                                            : (t('driver:pending') || 'Pending')}
                                                </span>
                                            </div>

                                            {/* Stop Arrival & Completion timestamps */}
                                            {stop.arrived_at && (
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                                    {formatTime(stop.arrived_at)}
                                                    {stop.completed_at && ` - ${formatTime(stop.completed_at)}`}
                                                </span>
                                            )}
                                        </div>

                                        {/* Customer Name & Address */}
                                        <div className="space-y-1.5">
                                            {customer?.name && (
                                                <div className="flex items-center gap-1.5 text-xs font-black text-gray-800">
                                                    <User size={13} className="text-gray-400 shrink-0" />
                                                    <span>{customer.name}</span>
                                                </div>
                                            )}

                                            {dl?.dropoff_address && (
                                                <div className="flex items-start gap-1.5 text-xs font-medium text-gray-500 leading-relaxed">
                                                    <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                                    <span>{dl.dropoff_address}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tracking & COD information */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            {dl?.tracking_number && (
                                                <div className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100 text-[10px] font-bold leading-none">
                                                    <Package size={10} className="text-gray-400" />
                                                    <span>{dl.tracking_number}</span>
                                                </div>
                                            )}

                                            {order && order.payment_method === 'cod' && (
                                                <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-100/50 leading-none">
                                                    <DollarSign size={10} />
                                                    <span>{order.amount_due_cod?.toFixed(2)} COD</span>
                                                </div>
                                            )}

                                            {stop.arrived_at && stop.completed_at && (
                                                <div className="flex items-center gap-1 bg-sky-50 text-sky-600 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-sky-100/50 leading-none ml-auto">
                                                    <Clock size={10} />
                                                    <span>{t('driver:stop_spent') || 'Spent'}: {calculateDuration(stop.arrived_at, stop.completed_at)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stop Notes if any */}
                                        {stop.notes && (
                                            <div className="bg-amber-50/50 border border-amber-100/50 p-2.5 rounded-xl text-xs text-amber-800 space-y-1">
                                                <div className="flex items-center gap-1 font-bold text-[9px] uppercase tracking-wide text-amber-700/80">
                                                    <FileText size={10} />
                                                    <span>{t('driver:stop_notes') || 'Stop Notes'}</span>
                                                </div>
                                                <p className="font-semibold text-amber-900 leading-snug">{stop.notes}</p>
                                            </div>
                                        )}

                                        {/* Proof of Delivery Card (If Completed) */}
                                        {pod && (
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block border-b pb-1">
                                                    {t('driver:proof_of_delivery') || 'Proof of Delivery'}
                                                </span>
                                                
                                                {/* Receiver name */}
                                                {pod.receiver_name && (
                                                    <div className="text-xs text-gray-600 font-semibold">
                                                        {t('driver:receiver') || 'Received by'}: <span className="font-bold text-gray-800">{pod.receiver_name}</span>
                                                    </div>
                                                )}

                                                {/* POD notes */}
                                                {pod.notes && (
                                                    <div className="text-xs text-gray-500 italic font-semibold">
                                                        "{pod.notes}"
                                                    </div>
                                                )}

                                                {/* POD photo url */}
                                                {pod.photo_url && (
                                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white max-w-[200px] mt-2 group/img shadow-sm hover:shadow transition-shadow">
                                                        <img 
                                                            src={pod.photo_url} 
                                                            alt="Proof of Delivery" 
                                                            className="w-full aspect-[4/3] object-cover"
                                                            onError={(e) => {
                                                                // Handle broken/local mock image files nicely
                                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200';
                                                            }}
                                                        />
                                                        <a 
                                                            href={pod.photo_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1.5 transition-all text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                        >
                                                            <Eye size={12} />
                                                            <span>View Large</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <Package size={36} className="opacity-20 mb-2" />
                        <p className="text-xs font-bold">{t('driver:no_stops_recorded') || 'No stops associated with this route.'}</p>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t bg-white shrink-0">
                <button
                    onClick={onClose}
                    className="w-full h-11 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-800 active:scale-[0.99] transition-all"
                >
                    {t('driver:close') || 'Close Timeline'}
                </button>
            </div>
        </BottomSheet>
    );
};
