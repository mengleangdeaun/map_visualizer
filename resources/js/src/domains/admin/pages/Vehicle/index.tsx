import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVehicles, useDeleteVehicle } from '../../hooks/useVehicles';
import { useDebounce } from '@/hooks/useDebounce';
import { Vehicle } from '../../services/vehicleService';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { Button } from '@/components/ui/button';
import { Truck, Plus, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import VehicleForm from './components/VehicleForm/index';
import VehicleMapView from './components/VehicleMapView';

const VehiclePage = () => {
    const { t } = useTranslation('system');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | undefined>(undefined);
    const [view, setView] = useState<'table' | 'map'>('table');

    const { data: vehiclesData, isLoading, isFetching, refetch } = useVehicles({
        page,
        per_page: perPage,
        search: debouncedSearch
    });

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleSearchClear = () => {
        setSearchInput('');
    };

    const deleteMutation = useDeleteVehicle();

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedVehicle(undefined);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (vehicleToDelete) {
            await deleteMutation.mutateAsync(vehicleToDelete.id);
            setIsDeleteModalOpen(false);
            setVehicleToDelete(undefined);
        }
    };

    const columns = useMemo<ColumnDef<Vehicle>[]>(() => [
        {
            id: 'index',
            header: '#',
            cell: (info) => {
                const displayIndex = info.table.getSortedRowModel().flatRows.findIndex(row => row.id === info.row.id);
                return (
                    <div className="text-[10px] font-black text-muted-foreground/50 w-4">
                        {(page - 1) * perPage + displayIndex + 1}
                    </div>
                );
            },
        },
        {
            accessorKey: 'plate_number',
            header: t('plate_number'),
            cell: ({ row }) => {
                const vehicle = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <Truck size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight uppercase font-mono tracking-wider">{vehicle.plate_number}</span>
                            <span className="text-[11px] text-muted-foreground leading-tight">
                                {t(`type_${vehicle.type}`)}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'driver',
            header: t('driver'),
            cell: ({ row }) => {
                const driver = row.original.driver;
                if (!driver) return <span className="text-muted-foreground text-xs italic">{t('unassigned')}</span>;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{driver.name}</span>
                        {driver.phone && <span className="text-[10px] text-muted-foreground font-mono">{driver.phone}</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "capitalize text-[10px] font-semibold px-2 py-0 border",
                            isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                        )}
                    >
                        {isActive ? t('active') : t('inactive')}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions')}</div>,
            cell: ({ row }) => {
                const vehicle = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="edit" 
                            onClick={() => handleEdit(vehicle)} 
                        />
                        <TableActionButton 
                            variant="delete" 
                            onClick={() => handleDeleteClick(vehicle)} 
                        />
                    </TableActionButtons>
                );
            },
        },
    ], [t, page, perPage]);

    return (
        <div>
            <PageHeader
                title={t('vehicle_management')}
                subtitle={t('manage_fleet_assets_and_driver_assignments')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_vehicle'),
                    onClick: handleAdd
                }}
                viewAction={{
                    view,
                    onChange: setView
                }}
            />

            {view === 'table' ? (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-sm">
                                <SearchInput
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder={t('search_plate_number')}
                                    onClear={handleSearchClear}
                                    isLoading={isFetching}
                                />
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={vehiclesData?.data || []}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        totalItems={vehiclesData?.total || 0}
                        currentPage={page}
                        pageSize={perPage}
                        pageCount={vehiclesData?.last_page || 1}
                        onPageChange={setPage}
                        onPageSizeChange={setPerPage}
                        searchQuery={debouncedSearch}
                        onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                        emptyActionLabel={debouncedSearch ? t('clear_search') : t('add_vehicle')}
                    />
                </div>
            ) : (
                <VehicleMapView 
                    vehicles={vehiclesData?.data || []} 
                    isLoading={isLoading}
                    isFetching={isFetching}
                />
            )}

            {isFormOpen && (
                <VehicleForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    vehicle={selectedVehicle}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_vehicle')}
                description={t('are_you_sure_you_want_to_delete_vehicle')}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default VehiclePage;
