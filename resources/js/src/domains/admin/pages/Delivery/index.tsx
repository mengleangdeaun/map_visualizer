import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    useDeliveries, 
    useDeleteDelivery 
} from './hooks/useDeliveries';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { 
    Plus, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    MapPin, 
    Truck, 
    User as UserIcon, 
    ClipboardList,
    DollarSign,
    Scale,
    CheckCircle2,
    XCircle,
    Package,
    Navigation,
    Activity,
    QrCode,
    CreditCard
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import DeliveryDialog from './components/DeliveryDialog';
import { Delivery } from '../../services/deliveryService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const DeliveryPage = () => {
    const { t } = useTranslation(['admin', 'system']);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | undefined>(undefined);

    // TanStack query & mutation hooks
    const { data: deliveriesData, isLoading, isFetching, refetch } = useDeliveries({
        page,
        per_page: perPage,
        search: debouncedSearch,
        status: statusFilter || undefined
    });
    const deleteMutation = useDeleteDelivery();

    const handleAdd = () => {
        setSelectedDelivery(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('admin:confirm_delete_delivery') || 'Are you sure you want to delete this delivery and its associated order?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleSearchClear = () => setSearch('');

    // Status styling maps using our HSL Tailored semantic colors (no hardcoded hex colors)
    const getStatusBadge = (status: Delivery['status']) => {
        const styles: Record<Delivery['status'], { label: string; className: string }> = {
            pending: { label: t('admin:status_pending', 'Pending'), className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
            at_hub: { label: t('admin:status_at_hub', 'At Hub'), className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
            linehaul: { label: t('admin:status_linehaul', 'Linehaul'), className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
            out_for_delivery: { label: t('admin:status_out_for_delivery', 'Out for Delivery'), className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
            delivered: { label: t('admin:status_delivered', 'Delivered'), className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
            failed: { label: t('admin:status_failed', 'Failed'), className: 'bg-destructive/10 text-destructive border-destructive/20' },
        };

        const config = styles[status] || { label: status, className: '' };
        return (
            <Badge variant="outline" className={`font-semibold capitalize px-2 py-0.5 text-[10px] ${config.className}`}>
                {config.label}
            </Badge>
        );
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'khqr':
                return <QrCode className="size-3.5 text-primary shrink-0" />;
            case 'postpaid':
                return <CreditCard className="size-3.5 text-blue-500 shrink-0" />;
            default:
                return <DollarSign className="size-3.5 text-emerald-500 shrink-0" />;
        }
    };

    const columns: ColumnDef<Delivery>[] = [
        {
            accessorKey: 'tracking_number',
            header: t('admin:tracking_number') || 'Tracking & Order',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="size-3 text-primary" />
                        </div>
                        <span className="text-xs font-black tracking-wider text-foreground">{row.original.tracking_number}</span>
                    </div>
                    {row.original.order && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="font-semibold uppercase text-[9px] bg-muted px-1.5 py-0.5 rounded border">
                                {row.original.order.order_number}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'customer',
            header: t('admin:customer') || 'Customer',
            cell: ({ row }) => {
                const customer = row.original.order?.customer;
                if (!customer) return <span className="text-xs text-muted-foreground">-</span>;
                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{customer.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{customer.phone}</span>
                    </div>
                );
            }
        },
        {
            id: 'payment',
            header: t('admin:payment_details') || 'Payment & COD',
            cell: ({ row }) => {
                const order = row.original.order;
                if (!order) return <span className="text-xs text-muted-foreground">-</span>;
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {getPaymentIcon(order.payment_method)}
                            <span className="capitalize">{order.payment_method}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2">
                            <span>Total: <strong className="text-foreground">${order.total_amount}</strong></span>
                            {order.amount_due_cod > 0 && (
                                <span className="text-yellow-600 dark:text-yellow-400 font-bold">COD: ${order.amount_due_cod}</span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            header: t('admin:status') || 'Fulfillment Status',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1.5">
                    <div>{getStatusBadge(row.original.status)}</div>
                    {row.original.weight_kg !== null && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-semibold">
                            <Scale className="size-3" />
                            {row.original.weight_kg} KG
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'driver',
            header: t('admin:assigned_driver') || 'Assigned Driver',
            cell: ({ row }) => {
                const driver = row.original.driver;
                if (!driver) return <span className="text-xs text-muted-foreground italic">{t('admin:unassigned', 'Unassigned')}</span>;
                return (
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-muted/65 flex items-center justify-center font-bold text-xs uppercase text-primary border">
                            {driver.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">{driver.name}</span>
                            <span className="text-[9px] text-muted-foreground font-mono">{driver.phone}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'logistics',
            header: t('admin:hubs_and_address') || 'Transit & Destination',
            cell: ({ row }) => {
                const origin = row.original.origin_hub?.name;
                const current = row.original.current_hub?.name;
                
                return (
                    <div className="flex flex-col gap-1 max-w-[200px]">
                        <div className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
                            <div className="flex flex-col">
                                {origin && (
                                    <span>Origin: <strong className="text-foreground">{origin}</strong></span>
                                )}
                                {current && current !== origin && (
                                    <span>Current: <strong className="text-foreground">{current}</strong></span>
                                )}
                            </div>
                        </div>
                        {row.original.dropoff_address && (
                            <div className="flex items-start gap-1 text-[10px] text-muted-foreground line-clamp-1">
                                <MapPin className="size-3 shrink-0 mt-0.5 text-primary/60" />
                                <span className="truncate">{row.original.dropoff_address}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('admin:actions') || 'Actions'}</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleEdit(row.original)} className="gap-2">
                                <Edit2 className="size-3.5" />
                                {t('admin:edit') || 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleDelete(row.original.id)} 
                                className="gap-2 text-destructive focus:text-destructive"
                            >
                                <Trash2 className="size-3.5" />
                                {t('admin:delete') || 'Delete'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full">
            <PageHeader 
                title={t('admin:delivery_management') || 'Delivery Operations'}
                subtitle={t('admin:manage_deliveries_desc') || 'Monitor real-time fulfillment statuses, assign shipping routes, and coordinate driver handoffs.'}
                refreshAction={{
                    onClick: refetch,
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('admin:create_delivery') || 'Create Delivery',
                    onClick: handleAdd,
                    icon: <Plus className="size-4 mr-2" />
                }}
            />

            <div className="flex-1 flex flex-col min-h-0 bg-card rounded-xl border shadow-xs overflow-hidden">
                
                {/* Search and status filters */}
                <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                    <div className="max-w-sm flex-1">
                        <SearchInput 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('admin:search_deliveries_placeholder') || 'Search tracking, order # or customer...'} 
                            onClear={handleSearchClear}
                            isLoading={isFetching}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-semibold">{t('admin:filter') || 'Status'}:</span>
                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
                        >
                            <SelectTrigger className="h-8 w-40 text-xs font-semibold">
                                <SelectValue placeholder={t('admin:all_statuses', 'All Statuses')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('admin:all_statuses', 'All Statuses')}</SelectItem>
                                <SelectItem value="pending">{t('admin:pending', 'Pending')}</SelectItem>
                                <SelectItem value="at_hub">{t('admin:at_hub', 'At Hub')}</SelectItem>
                                <SelectItem value="linehaul">{t('admin:linehaul', 'Linehaul')}</SelectItem>
                                <SelectItem value="out_for_delivery">{t('admin:out_for_delivery', 'Out for Delivery')}</SelectItem>
                                <SelectItem value="delivered">{t('admin:delivered', 'Delivered')}</SelectItem>
                                <SelectItem value="failed">{t('admin:failed', 'Failed')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={deliveriesData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={deliveriesData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={deliveriesData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                    emptyActionLabel={debouncedSearch ? t('admin:clear_search') : t('admin:create_delivery')}
                />
            </div>

            <DeliveryDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                delivery={selectedDelivery}
            />
        </div>
    );
};

export default DeliveryPage;
