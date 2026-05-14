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
import { Button } from '@/components/ui/button';
import { Plus, Building, MoreHorizontal, Edit2, Trash2, ArrowUpDown, Search, RotateCw } from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
    const search = useSearch({ from: '/system/companies' });
    const navigate = useNavigate({ from: '/system/companies' });

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
                            "capitalize text-[10px] font-black tracking-wider px-2 py-0 border",
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
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-card backdrop-blur-md border-border/50 shadow-xl">
                                <DropdownMenuItem onClick={() => handleEdit(company)} className="cursor-pointer group">
                                    <Edit2 className="mr-2 h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                                    {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(company)} 
                                    className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive group"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                    {t('delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [t, page, perPage, search.search]);

    return (
        <div>
            <PageHeader 
                title={t('company_management')} 
                subtitle={t('manage_tenants_and_organizations')}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <SearchInput
                            placeholder={t('search_companies')}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onClear={handleSearchClear}
                            isLoading={isFetching}
                            className="hidden sm:block w-[240px]"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="h-8 w-8 bg-background border-border hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                        >
                            <RotateCw className={cn("size-4 transition-all", isFetching && "animate-spin text-primary")} />
                        </Button>
                    </div>
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                        onClick={handleAdd}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('add_company')}
                    </Button>
                </div>
            </PageHeader>

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

            <div className="panel border-none p-0 overflow-hidden shadow-sm">
                <div className="p-4 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">{t('all_companies')}</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {data?.total || 0} {t('registered_organizations')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
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
        </div>
    );
};

export default CompanyPage;
