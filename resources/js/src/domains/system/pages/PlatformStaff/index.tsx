import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteUser } from '../User/hooks/useUsers';
import { usePlatformStaff } from './hooks/usePlatformStaff';
import { useDebounce } from '@/hooks/useDebounce';
import { User } from '../../services/userService';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { ShieldCheck, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import PlatformStaffForm from './components/PlatformStaffForm/index';

const PlatformStaffPage = () => {
    const { t } = useTranslation('system');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);

    // Filter by platform staff (users with no company_id or specific roles)
    // For now, let's assume super_admin and staff are platform roles
    const { data: usersData, isLoading, isFetching, refetch } = usePlatformStaff(
        debouncedSearch,
        page,
        perPage
    );

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
            accessorKey: 'name',
            header: t('staff_member'),
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                            <AvatarImage src={user.profile_full_url || ''} alt={user.name} />
                            <AvatarFallback className="bg-primary/5 text-primary">
                                <ShieldCheck size={16} />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight text-foreground">{user.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-bold uppercase tracking-wider bg-primary/10 text-primary border-none">
                                    {user.role}
                                </Badge>
                                {user.permissions && Object.keys(user.permissions).length > 0 && (
                                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-semibold uppercase tracking-wider border-dashed border-primary/30 text-primary/70">
                                        {Object.keys(user.permissions).length} PERMS
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'permissions',
            header: t('assigned_access'),
            cell: ({ row }) => {
                const perms = row.original.permissions as Record<string, boolean>;
                if (!perms || Object.keys(perms).length === 0) return <span className="text-muted-foreground text-[10px] italic">{t('no_permissions')}</span>;
                
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Object.entries(perms).filter(([_, v]) => v).map(([k]) => (
                            <div key={k} className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded border text-[9px] font-medium text-muted-foreground whitespace-nowrap uppercase">
                                <CheckCircle2 size={8} className="text-primary" />
                                {k.replace(/_/g, ' ')}
                            </div>
                        ))}
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
    ], [t]);

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('platform_team_management')}
                subtitle={t('manage_saas_internal_staff_and_permissions')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_team_member'),
                    onClick: handleAdd,
                    icon: <UserPlus className="size-4 mr-2" />
                }}
            />

            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-sm">
                        <SearchInput
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t('search_staff_members')}
                            onClear={handleSearchClear}
                            isLoading={isFetching}
                        />
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
                    emptyActionLabel={debouncedSearch ? t('clear_search') : t('add_team_member')}
                />
            </div>

            {isFormOpen && (
                <PlatformStaffForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    user={selectedUser}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('remove_staff_member')}
                description={t('are_you_sure_you_want_to_remove_staff', { name: userToDelete?.name })}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default PlatformStaffPage;
