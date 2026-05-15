import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { 
    Plus, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    User, 
    Phone, 
    Mail, 
    MapPin 
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomerDialog from './components/CustomerDialog';
import { Customer } from '../../services/customerService';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';

const CustomerPage = () => {
    const { t } = useTranslation(['admin', 'system']);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

    const { data: customersData, isLoading, isFetching, refetch } = useCustomers({ 
        page, 
        per_page: perPage, 
        search: debouncedSearch 
    });
    const deleteMutation = useDeleteCustomer();

    const handleAdd = () => {
        setSelectedCustomer(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('admin:confirm_delete_customer') || 'Are you sure you want to delete this customer?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleSearchClear = () => setSearch('');

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: 'name',
            header: t('admin:customer_name') || 'Customer',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {row.original.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">{row.original.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: {row.original.id.substring(0, 8)}</span>
                    </div>
                </div>
            )
        },
        {
            id: 'contact',
            header: t('admin:contact') || 'Contact',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs">
                        <Phone className="size-3 text-muted-foreground" />
                        {row.original.phone}
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-xs">
                            <Mail className="size-3 text-muted-foreground" />
                            {row.original.email}
                        </div>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'default_address',
            header: t('admin:address') || 'Default Address',
            cell: ({ row }) => (
                <div className="flex items-start gap-2 max-w-md">
                    <MapPin className="size-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-xs line-clamp-2">{row.original.default_address || '-'}</span>
                </div>
            )
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
                title={t('admin:customer_management') || 'Customer Management'}
                subtitle={t('admin:manage_your_customer_database') || 'Manage your customer contact details and addresses'}
                refreshAction={{
                    onClick: refetch,
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('admin:add_customer') || 'Add Customer',
                    onClick: handleAdd,
                    icon: <Plus className="size-4 mr-2" />
                }}
            />

            <div className="flex-1 flex flex-col min-h-0 bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between gap-4 bg-muted/20">
                    <div className="max-w-sm flex-1">
                        <SearchInput 
                            value={search}
                            onChange={setSearch}
                            placeholder={t('admin:search_customers') || 'Search name, phone or email...'} 
                            onClear={handleSearchClear}
                            isLoading={isFetching}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={customersData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={customersData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={customersData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                    emptyActionLabel={debouncedSearch ? t('admin:clear_search') : t('admin:add_customer')}
                />
            </div>

            <CustomerDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={selectedCustomer}
            />
        </div>
    );
};

export default CustomerPage;
