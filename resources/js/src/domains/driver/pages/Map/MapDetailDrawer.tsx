import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { 
    AlertTriangle, 
    Navigation, 
    Phone, 
    ChevronRight,
    MapPin,
    Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MapDetailDrawerProps {
    selectedItem: any;
    selectedType: 'delivery' | 'task' | 'roadblock' | null;
    onDismiss: () => void;
    onSelectTaskRoute?: (task: any) => void;
    onStartTaskNavigation?: (task: any) => void;
    hasRoutesPlanned?: boolean;
    isTaskInProgress?: boolean;
}

export const MapDetailDrawer: React.FC<MapDetailDrawerProps> = ({
    selectedItem,
    selectedType,
    onDismiss,
    onSelectTaskRoute,
    onStartTaskNavigation,
    hasRoutesPlanned = false,
    isTaskInProgress = false
}) => {
    const { t } = useTranslation(['delivery', 'driver']);
    const navigate = useNavigate();

    if (!selectedItem) return null;

    return (
        <div className={cn(
            "fixed bottom-[72px] left-0 right-0 z-40 transition-all duration-300 ease-out transform",
            selectedItem ? "translate-y-0" : "translate-y-full"
        )}>
            <div className="mx-auto max-w-md w-full bg-background/85 backdrop-blur-md border-t border-x border-border/50 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 space-y-0">
                {/* Clickable pull bar indicator to close */}
                <button 
                    onClick={onDismiss}
                    className="w-16 h-4 mx-auto -mt-3 mb-2 flex items-center justify-center group focus:outline-none"
                    title="Dismiss details drawer"
                >
                    <div className="w-12 h-1.5 bg-muted rounded-full group-hover:bg-muted-foreground/50 group-active:scale-95 transition-all duration-150" />
                </button>

                {/* A. Display Stop / Delivery context */}
                {selectedType === 'delivery' && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <Badge variant={selectedItem.status === 'completed' ? "outline" : "default"}>
                                    {t(`delivery:${selectedItem.status}`)}
                                </Badge>
                                <h3 className="text-lg font-bold tracking-tight">
                                    Stop #{selectedItem.sequence_number}: {selectedItem.delivery.order.customer.name}
                                </h3>
                            </div>
                            <a 
                                href={`tel:${selectedItem.delivery.order.customer.phone}`}
                                className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-all animate-pulse"
                                style={{ minHeight: '44px', minWidth: '44px' }}
                            >
                                <Phone size={18} />
                            </a>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground bg-muted/20 p-3.5 rounded-2xl">
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                                <span>{selectedItem.delivery.dropoff_address}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-2">
                                <span>{t('delivery:cod_due')}:</span>
                                <span className="font-black text-foreground">
                                    ${selectedItem.delivery.order.amount_due_cod.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                onClick={() => navigate({ to: '/driver/route/stop/$id', params: { id: String(selectedItem.id) } })}
                                className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                            >
                                <Navigation size={16} />
                                <span>{t('delivery:select_stop')}</span>
                            </Button>
                            
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.delivery.lat},${selectedItem.delivery.lng}&travelmode=driving`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 px-4 rounded-2xl bg-muted/50 border border-border/50 text-foreground flex items-center justify-center gap-2 font-bold hover:bg-muted active:scale-95 transition-all text-xs"
                            >
                                <MapPin size={16} className="text-green-500" />
                                <span>Navigate</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* B. Display Errands / Task context */}
                {selectedType === 'task' && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                    {t(`delivery:${selectedItem.status}`)}
                                </Badge>
                                <h3 className="text-lg font-bold tracking-tight">{selectedItem.title}</h3>
                            </div>
                            {selectedItem.phone && (
                                <a 
                                    href={`tel:${selectedItem.phone}`}
                                    className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-all animate-pulse"
                                    style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                    <Phone size={18} />
                                </a>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground bg-muted/20 p-3.5 rounded-2xl">
                            {selectedItem.description || "No additional errand description."}
                        </p>

                        <div className="flex flex-col gap-2">
                            {selectedItem.status !== 'completed' && (
                                <>
                                    {hasRoutesPlanned ? (
                                        <Button 
                                            onClick={() => onStartTaskNavigation?.(selectedItem)}
                                            disabled={isTaskInProgress}
                                            className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                                        >
                                            <Navigation size={16} className="animate-pulse" />
                                            <span>{isTaskInProgress ? "Starting Navigation..." : "Start Errand Route"}</span>
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={() => onSelectTaskRoute?.(selectedItem)}
                                            className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold bg-primary hover:bg-primary/90 text-white transition-all shadow-lg shadow-primary/10 active:scale-[0.98]"
                                        >
                                            <Compass size={16} />
                                            <span>Select Custom Route</span>
                                        </Button>
                                    )}
                                </>
                            )}
                            
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => navigate({ to: '/driver/tasks' })}
                                    className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all"
                                >
                                    <span>Manage Task</span>
                                </Button>
                                
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.dropoff_lat || selectedItem.pickup_lat || 11.5641},${selectedItem.dropoff_lng || selectedItem.pickup_lng || 104.8836}&travelmode=driving`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-12 px-4 rounded-2xl bg-muted/50 border border-border/50 text-foreground flex items-center justify-center gap-2 font-bold hover:bg-muted active:scale-95 transition-all text-xs"
                                >
                                    <MapPin size={16} className="text-green-500" />
                                    <span>Navigate</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* C. Display Roadblock Alerts context */}
                {selectedType === 'roadblock' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-destructive leading-tight">
                                    {t('delivery:hazard_title')}
                                </h3>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                    {t('delivery:hazard_dispatched')} {new Date(selectedItem.created_at).toLocaleTimeString()} {t('delivery:hazard_by')}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm font-semibold text-foreground bg-destructive/5 border border-destructive/20 p-4 rounded-2xl leading-relaxed">
                            "{selectedItem.description}"
                        </p>

                        <Button 
                            onClick={onDismiss}
                            variant="outline"
                            className="w-full h-11 rounded-2xl font-bold"
                        >
                            Dismiss Details
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
