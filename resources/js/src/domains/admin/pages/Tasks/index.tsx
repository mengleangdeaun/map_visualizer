import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    Edit2, 
    XCircle, 
    MapPin, 
    Navigation, 
    Truck, 
    User as UserIcon,
    Clock,
    ClipboardList,
    Archive,
    Trash2,
    LayoutDashboard,
    ArchiveRestore,
    CheckSquare,
    Square
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTasks, useUpdateTask, useDeleteTask } from '@/domains/admin/pages/Tasks/hooks/useTasks';
import TaskDialog from '@/domains/admin/pages/Tasks/components/TaskDialog';
import { Task, TaskStatus } from '@/domains/admin/pages/Tasks/services/taskService';
import { getTaskStatusColor } from '@/domains/admin/pages/Tasks/utils/taskStatus';
import { useNavigate } from '@tanstack/react-router';
import { formatDateTime } from '@/lib/dateUtils';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/system/DataTable';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { ConfirmModal } from '@/components/shared/system/ConfirmModal';
import { useDebounce } from '@/hooks/useDebounce';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const TaskListPage = () => {
    const { t } = useTranslation(['admin', 'system']);
    const navigate = useNavigate();
    
    // State
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [taskToCancel, setTaskToCancel] = useState<Task | null>(null);

    const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);

    // Queries & Mutations
    const { data: tasksData, isLoading, isFetching, refetch } = useTasks({ 
        search: debouncedSearch, 
        page,
        per_page: perPage,
        status: viewMode === 'archived' ? 'archived' : undefined
    });

    const updateMutation = useUpdateTask();
    const deleteMutation = useDeleteTask();

    // Reset selection and page on search or view mode change
    useEffect(() => {
        setPage(1);
        setRowSelection({});
    }, [debouncedSearch, viewMode]);

    // Handlers
    const handleCreate = () => {
        setSelectedTask(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleCancelClick = (task: Task) => {
        setTaskToCancel(task);
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (taskToCancel) {
            try {
                await updateMutation.mutateAsync({ 
                    id: taskToCancel.id, 
                    data: { ...taskToCancel, status: 'cancelled' } 
                });
                setIsCancelModalOpen(false);
                setTaskToCancel(null);
            } catch (error) {}
        }
    };

    const handleArchive = async (task: Task) => {
        try {
            await updateMutation.mutateAsync({ 
                id: task.id, 
                data: { ...task, status: 'archived' } 
            });
        } catch (error) {}
    };

    const handleRestore = async (task: Task) => {
        try {
            await updateMutation.mutateAsync({ 
                id: task.id, 
                data: { ...task, status: 'pending' } 
            });
        } catch (error) {}
    };

    const handleBulkArchive = () => {
        setIsBulkArchiveModalOpen(true);
    };

    const confirmBulkArchive = async () => {
        const selectedIds = Object.keys(rowSelection);
        if (selectedIds.length === 0) return;

        try {
            // In a real app, we should have a bulk update endpoint
            // For now, we loop through them
            const tasksToArchive = (tasksData?.data || []).filter((_, index) => rowSelection[index.toString()]);
            await Promise.all(tasksToArchive.map(task => 
                updateMutation.mutateAsync({ 
                    id: task.id, 
                    data: { ...task, status: 'archived' } 
                })
            ));
            setRowSelection({});
            setIsBulkArchiveModalOpen(false);
            refetch();
        } catch (error) {}
    };

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (taskToDelete) {
            await deleteMutation.mutateAsync(taskToDelete.id);
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        }
    };

    const handleTrackOnMap = (task: Task) => {
        navigate({ 
            to: '/admin/fleet/monitoring', 
            search: { task_id: task.id } 
        });
    };

    const handleSearchClear = () => {
        setSearchInput('');
    };


    const columns = useMemo<ColumnDef<Task>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px]"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
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
            accessorKey: 'title',
            header: t('task_info'),
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm line-clamp-1">{task.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="uppercase tracking-wider font-mono bg-muted px-1.5 py-0.5 rounded">
                                {task.id.slice(-8)}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'contact_name',
            header: t('contact_info', 'Contact'),
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <UserIcon className="size-4" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{task.contact_name || '-'}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{task.contact_phone || '-'}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-[10px] font-semibold", getTaskStatusColor(status))}>
                        {t(`status_${status}`) || status.replace('_', ' ')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'vehicle',
            header: t('vehicle_driver'),
            cell: ({ row }) => {
                const task = row.original;
                if (task.vehicle) {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <Truck className="size-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">{task.vehicle.plate_number}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{task.driver?.name || t('unassigned')}</span>
                            </div>
                        </div>
                    );
                }
                return <span className="text-xs text-muted-foreground italic">{t('not_dispatched')}</span>;
            },
        },
        {
            accessorKey: 'scheduled_at',
            header: t('scheduled'),
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="size-3 text-muted-foreground" />
                            <span>{task.scheduled_at ? formatDateTime(task.scheduled_at.toString()) : '-'}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">
                            {task.created_at ? formatDateTime(task.created_at) : ''}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions', { ns: 'system' })}</div>,
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <TableActionButtons>
                        <TableActionButton 
                            variant="view" 
                            icon={<MapPin className="size-3.5" />}
                            tooltip={t('track_on_map')}
                            onClick={() => handleTrackOnMap(task)}
                        />
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <TableActionButton 
                                variant="delete" 
                                icon={<XCircle className="size-3.5" />}
                                tooltip={t('cancel_task', 'Cancel Task')}
                                onClick={() => handleCancelClick(task)}
                            />
                        )}
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 h-8 w-8 p-0">
                                    <MoreVertical className="size-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleEdit(task)} className="gap-2">
                                    <Edit2 className="size-3.5" />
                                    <span>{t('edit')}</span>
                                </DropdownMenuItem>
                                
                                {task.status !== 'archived' ? (
                                    <DropdownMenuItem onClick={() => handleArchive(task)} className="gap-2">
                                        <Archive className="size-3.5" />
                                        <span>{t('archive')}</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => handleRestore(task)} className="gap-2">
                                        <ArchiveRestore className="size-3.5" />
                                        <span>{t('restore')}</span>
                                    </DropdownMenuItem>
                                )}                   
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteClick(task)} className="gap-2 text-destructive focus:text-destructive">
                                    <Trash2 className="size-3.5" />
                                    <span>{t('delete')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableActionButtons>
                );
            },
        },
    ], [t, page, perPage, viewMode]);

    const selectedCount = Object.keys(rowSelection).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('task_management')}
                subtitle={t('manage_fleet_tasks_desc', 'Monitor, create, and dispatch tasks to your fleet.')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('create_task'),
                    onClick: handleCreate
                }}
            />

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-muted/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 w-full max-w-xl">
                        <div className="flex-1">
                            <SearchInput
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('search_tasks_placeholder', 'Search tasks...')}
                                onClear={handleSearchClear}
                                isLoading={isFetching}
                            />
                        </div>
                        
                        {selectedCount > 0 && viewMode === 'active' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2 text-primary border-primary/20 hover:bg-primary/5 shrink-0 animate-in fade-in slide-in-from-left-2"
                                onClick={handleBulkArchive}
                            >
                                <Archive className="size-3.5" />
                                {t('archive_selected', `Archive (${selectedCount})`)}
                            </Button>
                        )}
                    </div>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
                        <TabsList className="grid w-full md:w-[240px] grid-cols-2 h-9">
                            <TabsTrigger value="active" className="text-[10px] font-bold gap-2">
                                <LayoutDashboard className="size-3" />
                                {t('active_tasks', 'Active')}
                            </TabsTrigger>
                            <TabsTrigger value="archived" className="text-[10px] font-bold gap-2">
                                <Archive className="size-3" />
                                {t('archived_tasks', 'Archived')}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <DataTable
                    columns={columns}
                    data={tasksData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={tasksData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={tasksData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={debouncedSearch ? handleSearchClear : handleCreate}
                    emptyActionLabel={debouncedSearch ? t('clear_search', { ns: 'system' }) : t('create_task')}
                    onRowSelectionChange={setRowSelection}
                    rowSelection={rowSelection}
                />
            </div>

            <TaskDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                task={selectedTask}
            />

            <ConfirmModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancel}
                title={t('cancel_task', 'Cancel Task')}
                description={t('confirm_cancel_task_desc', 'Are you sure you want to cancel this task?')}
                variant="destructive"
                icon={XCircle}
                confirmText={t('cancel_task', 'Cancel Task')}
                isPending={updateMutation.isPending}
            />

            <ConfirmModal
                isOpen={isBulkArchiveModalOpen}
                onClose={() => setIsBulkArchiveModalOpen(false)}
                onConfirm={confirmBulkArchive}
                title={t('archive_tasks', 'Archive Tasks')}
                description={t('confirm_bulk_archive_desc', { count: selectedCount, defaultValue: `Are you sure you want to archive ${selectedCount} tasks?` })}
                variant="primary"
                icon={Archive}
                confirmText={t('archive_selected', 'Archive Selected')}
                isPending={updateMutation.isPending}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_task', 'Delete Task')}
                description={t('confirm_delete_task_desc', 'Are you sure you want to delete this task? This action cannot be undone.')}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default TaskListPage;
