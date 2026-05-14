import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocations, useDeleteLocation } from './hooks/useLocations';
import { useDebounce } from '@/hooks/useDebounce';
import { Location } from '@/domains/fleet/services/locationService';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import LocationForm from './components/LocationForm/index';
import { HubMap } from './components/HubMap/HubMap';
import { useCompanies } from '../Company/hooks/useCompanies';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const LocationPage = () => {
    const { t } = useTranslation('system');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<Location | undefined>(undefined);
    const [view, setView] = useState<'table' | 'map'>('table');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

    const { data: companiesData } = useCompanies(1, 100);

    const { data: locationsData, isLoading, isFetching, refetch } = useLocations({
        page,
        per_page: perPage,
        search: debouncedSearch,
        company_id: selectedCompanyId === 'all' ? undefined : selectedCompanyId
    });

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCompanyId]);

    const handleSearchClear = () => {
        setSearchInput('');
    };

    const deleteMutation = useDeleteLocation();

    const handleEdit = (location: Location) => {
        setSelectedLocation(location);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedLocation(undefined);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (location: Location) => {
        setLocationToDelete(location);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (locationToDelete) {
            await deleteMutation.mutateAsync(locationToDelete.id);
            setIsDeleteModalOpen(false);
            setLocationToDelete(undefined);
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
            accessorKey: 'company',
            header: t('company'),
            cell: ({ row }) => row.original.company?.name || '-',
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions')}</div>,
            cell: ({ row }) => {
                const location = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="edit" 
                            onClick={() => handleEdit(location)} 
                        />
                        <TableActionButton 
                            variant="delete" 
                            onClick={() => handleDeleteClick(location)} 
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
                subtitle={t('manage_logistics_hubs_and_sorting_centers')}
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
            >
                <div className="flex items-center gap-2">
                    <Select
                        value={selectedCompanyId}
                        onValueChange={setSelectedCompanyId}
                    >
                        <SelectTrigger className="h-8 w-[150px] bg-background border-border shadow-sm">
                            <SelectValue placeholder={t('filter_by_company')} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border shadow-xl">
                            <SelectItem value="all">{t('all_companies') || 'All Companies'}</SelectItem>
                            {companiesData?.data.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {selectedCompanyId !== 'all' && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setSelectedCompanyId('all')}
                        >
                            <X size={14} />
                        </Button>
                    )}
                </div>
            </PageHeader>

            {view === 'table' ? (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-sm">
                                <SearchInput
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder={t('search_placeholder')}
                                    onClear={handleSearchClear}
                                    isLoading={isFetching}
                                />
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={locationsData?.data || []}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        totalItems={locationsData?.total || 0}
                        currentPage={page}
                        pageSize={perPage}
                        pageCount={locationsData?.last_page || 1}
                        onPageChange={setPage}
                        onPageSizeChange={setPerPage}
                        searchQuery={debouncedSearch}
                        onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                        emptyActionLabel={debouncedSearch ? t('clear_search') : t('add_hub')}
                    />
                </div>
            ) : (
                <HubMap 
                    locations={locationsData?.data || []} 
                    isLoading={isLoading}
                    isFetching={isFetching}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                />
            )}

            {isFormOpen && (
                <LocationForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    location={selectedLocation}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_location')}
                description={t('are_you_sure_you_want_to_delete_location')}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default LocationPage;
