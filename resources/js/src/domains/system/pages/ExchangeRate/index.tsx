import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useExchangeRates, useDeleteExchangeRate } from './hooks/useExchangeRates';
import { useDebounce } from '@/hooks/useDebounce';
import { ExchangeRate } from '../../services/exchangeRateService';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRightLeft, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import ExchangeRateForm from './components/ExchangeRateForm/index';
import { formatDateTime } from '@/lib/dateUtils';

const ExchangeRatePage = () => {
    const { t } = useTranslation('system');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRate, setSelectedRate] = useState<ExchangeRate | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [rateToDelete, setRateToDelete] = useState<ExchangeRate | undefined>(undefined);

    const { data: ratesData, isLoading, isFetching, refetch } = useExchangeRates({
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

    const deleteMutation = useDeleteExchangeRate();

    const handleEdit = (rate: ExchangeRate) => {
        setSelectedRate(rate);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedRate(undefined);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (rate: ExchangeRate) => {
        setRateToDelete(rate);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (rateToDelete) {
            await deleteMutation.mutateAsync(rateToDelete.id);
            setIsDeleteModalOpen(false);
            setRateToDelete(undefined);
        }
    };

    const columns = useMemo<ColumnDef<ExchangeRate>[]>(() => [
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
            accessorKey: 'currency_pair',
            header: t('currency'),
            cell: ({ row }) => {
                const rate = row.original;
                return (
                    <div className="flex items-center gap-2 font-semibold">
                        <span className="text-primary">{rate.from_currency}</span>
                        <ArrowRightLeft size={12} className="text-muted-foreground" />
                        <span className="text-primary">{rate.to_currency}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'rate',
            header: t('rate'),
            cell: ({ row }) => {
                const rate = row.original;
                return <span className="font-mono font-semibold">{rate.rate}</span>;
            },
        },
        {
            accessorKey: 'company',
            header: t('company'),
            cell: ({ row }) => row.original.company?.name || '-',
        },
        {
            accessorKey: 'effective_date',
            header: t('effective_date'),
            cell: ({ row }) => formatDateTime(row.original.effective_date),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions')}</div>,
            cell: ({ row }) => {
                const rate = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="edit" 
                            onClick={() => handleEdit(rate)} 
                        />
                        <TableActionButton 
                            variant="delete" 
                            onClick={() => handleDeleteClick(rate)} 
                        />
                    </TableActionButtons>
                );
            },
        },
    ], [t, page, perPage]);

    return (
        <div>
            <PageHeader
                title={t('exchange_rate_management')}
                subtitle={t('manage_currency_conversion_rates')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_exchange_rate'),
                    onClick: handleAdd
                }}
            />

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
                    data={ratesData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={ratesData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={ratesData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                    emptyActionLabel={debouncedSearch ? t('clear_search') : t('add_exchange_rate')}
                />
            </div>

            {isFormOpen && (
                <ExchangeRateForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    exchangeRate={selectedRate}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_exchange_rate')}
                description={t('are_you_sure_you_want_to_delete_exchange_rate')}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default ExchangeRatePage;
