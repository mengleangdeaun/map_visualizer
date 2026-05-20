import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Search, MapPin, User, Clock, MoreVertical, Truck, Edit2, Trash2, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDeliveries, useDeleteDelivery } from '@/domains/admin/pages/Delivery/hooks/useDeliveries';
import { Delivery } from '@/domains/admin/services/deliveryService';
import { getDeliveryStatusStyle } from '@/domains/admin/utils/statusStyles';
import DeliveryDialog from '@/domains/admin/pages/Delivery/components/DeliveryDialog';
import { ConfirmModal } from '@/components/shared/system/ConfirmModal';

interface DeliveryPanelProps {
    onFocusTarget?: (target: { id: string; type: 'vehicle' | 'hub' | 'task' | 'delivery'; center: [number, number] }) => void;
}

export const DeliveryPanel = ({ onFocusTarget }: DeliveryPanelProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | undefined>(undefined);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deliveryToDelete, setDeliveryToDelete] = useState<string | null>(null);

    const { data: deliveriesData, isLoading } = useDeliveries({
        search,
        per_page: 50
    });

    const deleteMutation = useDeleteDelivery();

    // Filter active deliveries (excluding delivered and failed)
    const activeDeliveries = useMemo(() => {
        if (!deliveriesData?.data) return [];
        return deliveriesData.data.filter((d: Delivery) => d.status !== 'delivered' && d.status !== 'failed');
    }, [deliveriesData]);

    const handleDeliveryClick = (delivery: Delivery) => {
        const driver = delivery.driver as any;
        if (driver?.latitude && driver?.longitude) {
            onFocusTarget?.({
                id: driver.id,
                type: 'vehicle',
                center: [Number(driver.longitude), Number(driver.latitude)]
            });
        } else if (delivery.dropoff_longitude && delivery.dropoff_latitude) {
            onFocusTarget?.({
                id: delivery.id,
                type: 'delivery',
                center: [Number(delivery.dropoff_longitude), Number(delivery.dropoff_latitude)]
            });
        }
    };

    const handleEditClick = (e: React.MouseEvent, delivery: Delivery) => {
        e.stopPropagation();
        setSelectedDelivery(delivery);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeliveryToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDeleteDelivery = async () => {
        if (!deliveryToDelete) return;
        try {
            await deleteMutation.mutateAsync(deliveryToDelete);
            setIsConfirmOpen(false);
            setDeliveryToDelete(null);
        } catch (error) {}
    };

    return (
        <div className="h-full flex flex-col min-h-0">
            <div className="p-4 pt-0 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Package className="size-4 text-indigo-500" />
                        </div>
                        <h2 className="font-bold text-sm tracking-tight">{t('admin:active_deliveries') || 'Active Deliveries'}</h2>
                    </div>
                    <Button size="sm" className="h-8 gap-1 shadow-sm bg-indigo-600 hover:bg-indigo-500" onClick={() => {
                        setSelectedDelivery(undefined);
                        setIsDialogOpen(true);
                    }}>
                        <Plus className="size-3" />
                        {t('admin:new_delivery') || 'New Delivery'}
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input 
                        placeholder={t('admin:search_deliveries') || 'Search tracking # or address...'} 
                        className="pl-9 h-9 text-xs focus-visible:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 h-full min-h-0">
                <div className="p-4 space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                        ))
                    ) : activeDeliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                            <div className="p-3 bg-muted/50 rounded-full">
                                <Package className="size-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">{t('admin:no_deliveries_found') || 'No deliveries found'}</p>
                        </div>
                    ) : (
                        activeDeliveries.map((delivery) => (
                            <div 
                                key={delivery.id}
                                className={cn(
                                    "group relative p-3 rounded-xl border bg-gradient-to-b from-card to-background transition-all cursor-pointer hover:shadow-md hover:border-indigo-500/20",
                                )}
                                onClick={() => handleDeliveryClick(delivery)}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                                                    {delivery.tracking_number}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-xs truncate leading-tight">
                                                {delivery.order?.customer?.name || t('admin:anonymous_customer', 'Customer')}
                                            </h3>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="outline" className={cn("text-[9px] h-5 capitalize font-semibold px-1.5", getDeliveryStatusStyle(delivery.status))}>
                                                {t(`admin:status_${delivery.status}`) || delivery.status.replace('_', ' ')}
                                            </Badge>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical className="size-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="gap-2 focus:text-indigo-600 focus:bg-indigo-50/50" onClick={(e) => handleEditClick(e, delivery)}>
                                                        <Edit2 className="size-3.5" />
                                                        <span>{t('admin:edit_delivery') || 'Edit Delivery'}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="gap-2 text-destructive focus:text-destructive" 
                                                        onClick={(e) => handleDeleteClick(e, delivery.id)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        <span>{t('admin:delete_delivery') || 'Delete Delivery'}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="size-3 shrink-0 text-indigo-500/60" />
                                            <span className="text-[10px] w-44 !truncate">{delivery.dropoff_address || t('admin:no_address')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="size-3 shrink-0" />
                                                <span className="text-[10px] font-medium truncate">{delivery.driver?.name || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {(delivery.driver as any)?.vehicles?.[0] && (
                                                    <Badge variant="secondary" className="h-5 text-[9px] gap-1 px-1.5 bg-muted/50 border-none">
                                                        <Truck className="size-2.5" />
                                                        {(delivery.driver as any).vehicles[0].plate_number}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <DeliveryDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                delivery={selectedDelivery}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDeleteDelivery}
                title={t('admin:confirm_delete_delivery_title') || 'Delete Delivery'}
                description={t('admin:confirm_delete_delivery') || 'Are you sure you want to delete this delivery and its associated order? This action cannot be undone.'}
                confirmText={t('admin:delete_delivery', 'Delete Delivery')}
                variant="destructive"
            />
        </div>
    );
};
