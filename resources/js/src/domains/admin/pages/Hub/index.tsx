import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminHubs, useDeleteAdminHub } from './hooks/useAdminHubs';
import { useDebounce } from '@/hooks/useDebounce';
import { Location } from '@/domains/fleet/services/locationService';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import HubForm from './components/HubForm/index';
import { HubMap } from '@/domains/system/pages/Location/components/HubMap/HubMap';

const HubPage = () => {
    const { t } = useTranslation(['admin', 'system']);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedHub, setSelectedHub] = useState<Location | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [hubToDelete, setHubToDelete] = useState<Location | undefined>(undefined);
    const [view, setView] = useState<'table' | 'map'>('table');

    const { data: hubsData, isLoading, isFetching, refetch } = useAdminHubs({
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

    const deleteMutation = useDeleteAdminHub();

    const handleEdit = (hub: Location) => {
        setSelectedHub(hub);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedHub(undefined);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (hub: Location) => {
        setHubToDelete(hub);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (hubToDelete) {
            await deleteMutation.mutateAsync(hubToDelete.id);
            setIsDeleteModalOpen(false);
            setHubToDelete(undefined);
        }
    };

    const columns = useMemo<ColumnDef<Location>[]>(() => [
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
            accessorKey: 'name',
            header: t('hub_name'),
            cell: ({ row }) => {
                const location = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <MapPin size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight">{location.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono leading-tight">
                                {location.code}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            header: t('hub_type'),
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                return (
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "capitalize text-[10px] font-semibold px-2 py-0 border",
                            type === 'main_sort' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                            type === 'regional_hub' && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                            type === 'local_node' && "bg-orange-500/10 text-orange-600 border-orange-500/20"
                        )}
                    >
                        {t(`type_${type}`)}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('system:actions')}</div>,
            cell: ({ row }) => {
                const hub = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="edit" 
                            onClick={() => handleEdit(hub)} 
                        />
                        <TableActionButton 
                            variant="delete" 
                            onClick={() => handleDeleteClick(hub)} 
                        />
                    </TableActionButtons>
                );
            },
        },
    ], [t, page, perPage]);

    return (
        <div>
            <PageHeader
                title={t('hub_management')}
                subtitle={t('manage_logistics_hubs_and_centers')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_hub'),
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
                                    placeholder={t('system:search_placeholder')}
                                    onClear={handleSearchClear}
                                    isLoading={isFetching}
                                />
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={hubsData?.data || []}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        totalItems={hubsData?.total || 0}
                        currentPage={page}
                        pageSize={perPage}
                        pageCount={hubsData?.last_page || 1}
                        onPageChange={setPage}
                        onPageSizeChange={setPerPage}
                        searchQuery={debouncedSearch}
                        onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                        emptyActionLabel={debouncedSearch ? t('system:clear_search') : t('add_hub')}
                    />
                </div>
            ) : (
                <HubMap 
                    locations={hubsData?.data || []} 
                    isLoading={isLoading}
                    isFetching={isFetching}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                />
            )}

            {isFormOpen && (
                <HubForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    location={selectedHub}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_hub')}
                description={t('are_you_sure_you_want_to_delete_hub', { name: hubToDelete?.name })}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default HubPage;
