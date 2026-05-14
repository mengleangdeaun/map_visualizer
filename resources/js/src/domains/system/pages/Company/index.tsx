import React, { useState, useMemo, useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useDebounce } from '@/hooks/useDebounce';
import { useCompanies, useDeleteCompany } from './hooks/useCompanies';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import CompanyModal from './components/CompanyModal';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { HighlightSearch } from '@/components/shared/system/HighlightSearch';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Company } from '@/domains/system/services/companyService';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const CompanyPage = () => {
    const { t } = useTranslation('system');
    const search = useSearch({ from: '/layout/system/companies' });
    const navigate = useNavigate({ from: '/layout/system/companies' });

    const page = search.page || 1;
    const perPage = search.per_page || 10;
    const [searchInput, setSearchInput] = useState(search.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);
    
    const { data, isLoading, isFetching, refetch } = useCompanies(page, perPage, search.search);
    const deleteMutation = useDeleteCompany();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

    // Sync debounced search to URL
    useEffect(() => {
        if (debouncedSearch !== (search.search || '')) {
            navigate({
                search: (prev: any) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }),
                replace: true,
            });
        }
    }, [debouncedSearch, search.search, navigate]);

    const setPage = (newPage: number) => {
        navigate({ search: (prev: any) => ({ ...prev, page: newPage }) });
    };

    const setPerPage = (newSize: number) => {
        navigate({ search: (prev: any) => ({ ...prev, per_page: newSize, page: 1 }) });
    };

    const handleSearchClear = () => {
        setSearchInput('');
        navigate({
            search: (prev: any) => ({ ...prev, search: undefined, page: 1 }),
            replace: true,
        });
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCompany(null);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (company: Company) => {
        setCompanyToDelete(company);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (companyToDelete) {
            deleteMutation.mutate(companyToDelete.id, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setCompanyToDelete(null);
                }
            });
        }
    };

    const columns = useMemo<ColumnDef<Company>[]>(() => [
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
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="p-0 hover:bg-transparent text-xs font-bold uppercase tracking-wider"
                    >
                        {t('name')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const company = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={company.logo_full_url || company.logo_url || ''} alt={company.name} className="object-cover" />
                            <AvatarFallback className=" text-primary">
                                {company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <HighlightSearch 
                                text={company.name} 
                                query={search.search || ''} 
                                className="font-bold text-foreground/90 leading-tight"
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {company.slug}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "capitalize text-[10px] font-semibold px-2 py-0 border",
                            status === 'active' && "bg-green-500/10 text-green-600 border-green-500/20",
                            status === 'inactive' && "bg-gray-500/10 text-gray-500 border-gray-500/20",
                            status === 'suspended' && "bg-red-500/10 text-red-600 border-red-500/20"
                        )}
                    >
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'tax_id',
            header: t('tax_id'),
            cell: ({ row }) => <div className="text-muted-foreground font-medium">{row.getValue('tax_id') || '-'}</div>,
        },
        {
            accessorKey: 'base_currency',
            header: t('currency'),
            cell: ({ row }) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                    {row.getValue('base_currency')}
                </span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: t('created_at'),
            cell: ({ row }) => (
                <div className="text-muted-foreground/80 font-medium">
                    {new Date(row.getValue('created_at')).toLocaleDateString()}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions')}</div>,
            cell: ({ row }) => {
                const company = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="edit" 
                            onClick={() => handleEdit(company)} 
                        />
                        <TableActionButton 
                            variant="delete" 
                            onClick={() => handleDeleteClick(company)} 
                        />
                    </TableActionButtons>
                );
            },
        },
    ], [t, page, perPage, search.search]);

    return (
        <div>
            <PageHeader 
                title={t('company_management')} 
                subtitle={t('manage_tenants_and_organizations')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_company'),
                    onClick: handleAdd
                }}
            />

            <CompanyModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                initialData={selectedCompany}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_company')}
                description={t('are_you_sure_you_want_to_delete_company', { name: companyToDelete?.name })}
                isPending={deleteMutation.isPending}
            />

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-sm">
                            <SearchInput
                                placeholder={t('search_companies')}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onClear={handleSearchClear}
                                isLoading={isFetching}
                            />
                        </div>
                    </div>
                </div>
                    <DataTable 
                        columns={columns} 
                        data={data?.data || []} 
                        isLoading={isLoading}
                        isFetching={isFetching}
                        searchColumn="name"
                        searchQuery={search.search}
                        
                        // Pagination & Controls
                        totalItems={data?.total}
                        pageSize={perPage}
                        pageCount={data?.last_page}
                        currentPage={page}
                        onPageChange={(page) => setPage(page)}
                        onPageSizeChange={(size) => {
                            setPerPage(size);
                            setPage(1);
                        }}
                        onEmptyAction={search.search ? handleSearchClear : () => setIsModalOpen(true)}
                        emptyActionLabel={search.search ? t('clear_search') : t('add_new_company')}
                    />
                
            </div>
        </div>
    );
};

export default CompanyPage;
