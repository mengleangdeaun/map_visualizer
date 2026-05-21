import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderStore } from '../../store/useHeaderStore';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    MapPin, 
    Phone, 
    Navigation, 
    CheckCircle2, 
    AlertTriangle, 
    DollarSign,
    Package,
    ArrowLeft,
    FileText,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const StopDetailsPage = () => {
    const { t } = useTranslation(['delivery', 'driver']);
    const { id } = useParams({ strict: false });
    const queryClient = useQueryClient();
    const setHeader = useHeaderStore(s => s.setHeader);

    // Modal state for failing/skipping stops
    const [showFailModal, setShowFailModal] = useState(false);
    const [failReason, setFailReason] = useState('customer_unreachable');
    const [failNotes, setFailNotes] = useState('');

    useEffect(() => {
        setHeader({ 
            title: t('delivery:customer_details') || 'Stop Details',
            showBackButton: true,
            backTarget: '/driver/route'
        });
        return () => setHeader({});
    }, [setHeader, t]);

    // Query active route to find this specific stop
    const { data: routeData, isLoading } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        }
    });

    // Find our specific stop
    const stop = routeData?.stops?.find((s: any) => s.id === id);

    // Real-time tick stopwatch for arrived stops
    const [currentTime, setCurrentTime] = useState(Date.now());
    const isArrived = stop?.status === 'arrived';

    useEffect(() => {
        if (isArrived) {
            const timer = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isArrived]);

    const getStatusLabelAndColor = (stopStatus: string, deliveryStatus: string) => {
        if (stopStatus === 'completed') {
            return {
                label: t('delivery:delivered') || 'Delivered',
                className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-none'
            };
        }
        if (stopStatus === 'skipped') {
            if (deliveryStatus === 'rescheduled') {
                return {
                    label: t('delivery:rescheduled') || 'Rescheduled',
                    className: 'bg-amber-500 hover:bg-amber-600 text-white border-none'
                };
            }
            return {
                label: t('delivery:failed') || 'Failed',
                className: 'bg-destructive hover:bg-destructive text-destructive-foreground border-none'
            };
        }
        if (stopStatus === 'arrived') {
            return {
                label: t('delivery:arrived') || 'Arrived',
                className: 'bg-blue-500 hover:bg-blue-600 text-white border-none animate-pulse'
            };
        }
        return {
            label: t('delivery:pending') || 'Pending',
            className: 'bg-muted hover:bg-muted text-muted-foreground border-none'
        };
    };

    const formatDuration = (startedAt: string | null, completedAt: string | null) => {
        if (!startedAt) return '';
        const start = new Date(startedAt).getTime();
        const end = completedAt ? new Date(completedAt).getTime() : currentTime;
        const diffMs = end - start;
        if (diffMs < 0) return '0s';
        
        const diffSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    // Mutation to mark arrived
    const arriveMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/driver/route/stops/${id}/arrive`);
            return data;
        },
        onSuccess: () => {
            toast.success("Arrival confirmed");
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to confirm arrival");
        }
    });

    // Mutation to fail/skip stop
    const failMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/driver/route/stops/${id}/fail`, {
                reason_code: failReason,
                notes: failNotes
            });
            return data;
        },
        onSuccess: () => {
            toast.warning("Stop exception logged");
            if ('vibrate' in navigator) {
                navigator.vibrate([150, 50, 150]);
            }
            setShowFailModal(false);
            window.location.href = '/driver/route';
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to log exception");
        }
    });

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    if (!stop) {
        return (
            <div className="p-6 text-center text-muted-foreground italic text-sm">
                Stop details not found or completed.
            </div>
        );
    }

    const dl = stop.delivery;
    const isPending = stop.status === 'pending';
    // isArrived is declared above
    const isCompleted = stop.status === 'completed';
    const isSkipped = stop.status === 'skipped';

    // Deep link to navigate via Google Maps
    const handleOpenNavigation = () => {
        if (dl.lat && dl.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${dl.lat},${dl.lng}`;
            window.open(url, '_blank');
        } else {
            toast.error("Coordinates not set for this stop");
        }
    };

    return (
        <div className="p-4 flex flex-col gap-4 pb-28 relative">
            {/* 1. Stop Header Overview Card */}
            <Card className="p-4 border-none shadow-md bg-card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                                Stop #{stop.sequence_number}
                            </span>
                            <Badge className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                getStatusLabelAndColor(stop.status, dl.status).className
                            )}>
                                {getStatusLabelAndColor(stop.status, dl.status).label}
                            </Badge>
                        </div>
                        <h2 className="text-xl font-black text-foreground tracking-tight mt-1">
                            {dl.order.customer.name}
                        </h2>
                    </div>
                    <a 
                        href={`tel:${dl.order.customer.phone}`}
                        className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 active:scale-95 transition-all"
                    >
                        <Phone size={18} />
                    </a>
                </div>

                {/* Delivery Address & Navigation */}
                <div className="space-y-3.5">
                    <div className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                        <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                        <span>{dl.dropoff_address}</span>
                    </div>

                    {(isPending || isArrived) && (
                        <Button
                            onClick={handleOpenNavigation}
                            variant="outline"
                            className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 font-bold"
                        >
                            <Navigation size={16} className="text-primary" />
                            Open Map Navigation
                        </Button>
                    )}
                </div>
            </Card>

            {/* Stop Timeline & Duration Card */}
            {(dl.started_at || dl.scheduled_at) && (
                <Card className="p-4 border-none shadow-md bg-card space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                        <Clock size={18} className="text-primary" />
                        <h3 className="font-bold text-base text-foreground">
                            {t('driver:stop_timeline') || 'Stop Timeline & Duration'}
                        </h3>
                    </div>
                    <div className="relative pl-6 border-l-2 border-primary/20 space-y-4 text-sm">
                        {/* Scheduled point */}
                        {dl.scheduled_at && (
                            <div className="relative">
                                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-400 border-4 border-background" />
                                <p className="font-bold text-xs text-foreground">
                                    {t('driver:scheduled') || 'Scheduled Time'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {new Date(dl.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}
                        {/* Arrival point */}
                        {dl.started_at && (
                            <div className="relative">
                                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-4 border-background" />
                                <p className="font-bold text-xs text-foreground">
                                    {t('driver:arrived_stop') || 'Arrived at Stop'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {new Date(dl.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}
                        {/* Completion / Active timer point */}
                        {stop.status === 'arrived' && dl.started_at && (
                            <div className="relative">
                                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-4 border-background animate-ping" />
                                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-4 border-background" />
                                <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                    {t('driver:in_progress') || 'In Progress'}
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </p>
                                <p className="text-xs font-black text-amber-500 mt-1">
                                    {t('driver:elapsed') || 'Elapsed'}: {formatDuration(dl.started_at, null)}
                                </p>
                            </div>
                        )}
                        {(isCompleted || isSkipped) && dl.started_at && dl.completed_at && (
                            <div className="relative">
                                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-background" />
                                <p className="font-bold text-xs text-foreground">
                                    {t('driver:resolved') || 'Resolved'} ({getStatusLabelAndColor(stop.status, dl.status).label})
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {new Date(dl.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs font-black text-emerald-600 mt-1">
                                    {t('driver:total_duration') || 'Total Duration'}: {formatDuration(dl.started_at, dl.completed_at)}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* 2. Parcel Items List Card */}
            <Card className="p-4 border-none shadow-md bg-card space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <Package size={18} className="text-primary" />
                    <h3 className="font-bold text-base text-foreground">
                        {t('delivery:items_to_deliver')}
                    </h3>
                </div>

                <div className="divide-y divide-border/50">
                    {dl.order.items.map((item: any) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                            <div>
                                <p className="font-bold text-foreground">{item.product_name}</p>
                                <span className="text-[10px] text-muted-foreground uppercase">
                                    SKU: {item.sku || "N/A"}
                                </span>
                            </div>
                            <span className="font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                                x{item.quantity}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Package weight */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span>{t('delivery:parcel_weight')}:</span>
                    <span className="font-semibold">{dl.weight_kg.toFixed(2)} kg</span>
                </div>
            </Card>

            {/* 3. COD Collections Card */}
            <Card className="p-4 border-none shadow-md bg-card flex items-center justify-between">
                <div className="space-y-0.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase block">
                        {t('delivery:cod_due')}
                    </span>
                    <span className="text-xs font-bold text-primary italic uppercase block">
                        Method: {dl.order.payment_method}
                    </span>
                </div>
                <div className="flex items-center font-black text-2xl text-foreground">
                    <DollarSign size={20} className="text-emerald-500" />
                    <span>{dl.order.amount_due_cod.toFixed(2)}</span>
                </div>
            </Card>

            {/* 4. Navigation & State Actions Bar (Minimum 44px) */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border/50 p-4 z-10 flex gap-3 max-w-md mx-auto">
                {isPending && (
                    <Button
                        onClick={() => arriveMutation.mutate()}
                        className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Navigation size={18} />
                        Confirm Arrival at Stop
                    </Button>
                )}

                {isArrived && (
                    <>
                        <Button
                            onClick={() => setShowFailModal(true)}
                            variant="destructive"
                            className="w-[120px] h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
                        >
                            <AlertTriangle size={16} />
                            Exception
                        </Button>
                        <Button
                            onClick={() => window.location.href = `/driver/route/stop/${id}/pod`}
                            className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                        >
                            <CheckCircle2 size={18} />
                            Resolve Success
                        </Button>
                    </>
                )}
            </div>

            {/* 5. Custom Stop Exception Dialog Overlay */}
            {showFailModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
                    <div className="max-w-md w-full bg-background border border-border/50 rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center gap-2 text-destructive border-b border-border/50 pb-3">
                            <AlertTriangle size={20} />
                            <h3 className="font-bold text-lg text-foreground">
                                {t('delivery:report_issue')}
                            </h3>
                        </div>

                        {/* Dropdown Selector */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                                {t('delivery:issue_reason')}
                            </label>
                            <select
                                value={failReason}
                                onChange={(e) => setFailReason(e.target.value)}
                                className="w-full h-11 rounded-xl bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none"
                            >
                                <option value="customer_unreachable">{t('delivery:reason_unreachable')}</option>
                                <option value="address_not_found">{t('delivery:reason_address')}</option>
                                <option value="refused_payment">{t('delivery:reason_refused_payment')}</option>
                                <option value="refused_delivery">{t('delivery:reason_refused_delivery')}</option>
                                <option value="damaged_package">{t('delivery:reason_damaged')}</option>
                                <option value="rescheduled">{t('delivery:reason_rescheduled')}</option>
                                <option value="other">{t('delivery:reason_other')}</option>
                            </select>
                        </div>

                        {/* Description Notes */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                                {t('delivery:notes')}
                            </label>
                            <textarea
                                value={failNotes}
                                onChange={(e) => setFailNotes(e.target.value)}
                                placeholder="Enter specific exception details..."
                                className="w-full h-24 rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none resize-none"
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={() => setShowFailModal(false)}
                                variant="outline"
                                className="flex-1 h-11 rounded-2xl font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => failMutation.mutate()}
                                variant="destructive"
                                className="flex-1 h-11 rounded-2xl font-bold"
                            >
                                Log Exception
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StopDetailsPage;
