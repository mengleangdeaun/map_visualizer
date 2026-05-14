import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsers, useDeleteUser } from './hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { User } from '../../services/userService';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, User as UserIcon, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import UserForm from './components/UserForm/index';

const UserPage = () => {
    const { t } = useTranslation('system');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);

    const { data: usersData, isLoading, isFetching, refetch } = useUsers({
        page,
        per_page: perPage,
        search: debouncedSearch,
        type: 'company'
    });

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleSearchClear = () => {
        setSearchInput('');
    };

    const deleteMutation = useDeleteUser();

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(undefined);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await deleteMutation.mutateAsync(userToDelete.id);
            setIsDeleteModalOpen(false);
            setUserToDelete(undefined);
        }
    };

    const columns = useMemo<ColumnDef<User>[]>(() => [
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
            header: t('user_name'),
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border/50">
                            <AvatarImage src={user.profile_full_url || ''} alt={user.name} />
                            <AvatarFallback className="bg-primary/5 text-primary">
                                <UserIcon size={14} />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight">{user.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono leading-tight">
                                {user.role.toUpperCase()}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'contact',
            header: t('phone') + ' / ' + t('email'),
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.phone}</span>
                        {user.email && (
                            <span className="text-[11px] text-muted-foreground">{user.email}</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'company',
            header: t('company'),
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.company?.name || '-'}</span>
                        {user.hub && (
                            <span className="text-[11px] text-muted-foreground">{user.hub.name}</span>
                        )}
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
                        {t(`status_${status}`)}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions')}</div>,
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="edit" 
                            onClick={() => handleEdit(user)} 
                        />
                        <TableActionButton 
                            variant="delete" 
                            onClick={() => handleDeleteClick(user)} 
                        />
                    </TableActionButtons>
                );
            },
        },
    ], [t, page, perPage]);

    return (
        <div>
            <PageHeader
                title={t('user_management')}
                subtitle={t('manage_system_users_and_roles')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_user') || 'Add User',
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
                                placeholder={t('search_users')}
                                onClear={handleSearchClear}
                                isLoading={isFetching}
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={usersData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={usersData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={usersData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                    emptyActionLabel={debouncedSearch ? t('clear_search') : t('add_user')}
                />
            </div>

            {isFormOpen && (
                <UserForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    user={selectedUser}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_user')}
                description={t('are_you_sure_you_want_to_delete_user', { name: userToDelete?.name })}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default UserPage;
