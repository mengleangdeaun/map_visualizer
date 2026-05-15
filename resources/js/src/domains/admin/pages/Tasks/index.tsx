import { useState } from 'react';
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
    ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTasks, useUpdateTask } from '@/domains/admin/tasks/hooks/useTasks';
import TaskDialog from '@/domains/admin/tasks/components/TaskDialog';
import { TaskStatus } from '@/domains/admin/tasks/services/taskService';
import { Link } from '@tanstack/react-router';
import { formatDateTime } from '@/lib/dateUtils';

const TaskListPage = () => {
    const { t } = useTranslation('admin');
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const { data: tasksData, isLoading } = useTasks({ 
        search, 
        per_page: 50 
    });

    const updateMutation = useUpdateTask();

    const handleCreate = () => {
        setSelectedTask(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (task: any) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleCancel = async (task: any) => {
        if (confirm(t('confirm_cancel_task', 'Are you sure you want to cancel this task?'))) {
            try {
                await updateMutation.mutateAsync({ 
                    id: task.id, 
                    data: { ...task, status: 'cancelled' } 
                });
            } catch (error) {}
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'assigned': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ClipboardList className="size-6 text-primary" />
                        {t('task_management') || 'Task Management'}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('manage_fleet_tasks_desc', 'Monitor, create, and dispatch tasks to your fleet.')}
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="size-4" />
                    {t('create_task') || 'Create Task'}
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('search_tasks_placeholder', 'Search by title or order ID...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2 h-9">
                            <Filter className="size-4" />
                            {t('filters') || 'Filters'}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-muted">
                                <TableHead className="w-[300px]">{t('task_info') || 'Task Info'}</TableHead>
                                <TableHead>{t('customer') || 'Customer'}</TableHead>
                                <TableHead>{t('status') || 'Status'}</TableHead>
                                <TableHead>{t('vehicle_driver') || 'Vehicle / Driver'}</TableHead>
                                <TableHead>{t('scheduled') || 'Scheduled'}</TableHead>
                                <TableHead className="text-right">{t('actions') || 'Actions'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        <TableCell colSpan={6}>
                                            <div className="h-12 bg-muted/50 rounded-lg" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : tasksData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <ClipboardList className="size-12 opacity-20" />
                                            <p>{t('no_tasks_found', 'No tasks found.')}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasksData?.data.map((task) => (
                                    <TableRow key={task.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-sm line-clamp-1">{task.title}</span>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <span className="uppercase tracking-wider font-mono bg-muted px-1.5 py-0.5 rounded">
                                                        {task.id.slice(-8)}
                                                    </span>
                                                    {task.external_order_id && (
                                                        <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal border-blue-500/20 text-blue-600 bg-blue-500/5">
                                                            {task.external_order_id}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <UserIcon className="size-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{task.customer?.name || 'Walk-in'}</span>
                                                    <span className="text-[10px] text-muted-foreground">{task.customer?.phone || '-'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-[10px] font-semibold", getStatusColor(task.status))}>
                                                {t(`status_${task.status}`) || task.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {task.vehicle ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                        <Truck className="size-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold">{task.vehicle.plate_number}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{task.driver?.name || t('unassigned')}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">{t('not_dispatched')}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Clock className="size-3 text-muted-foreground" />
                                                    <span>{task.scheduled_at ? formatDateTime(task.scheduled_at) : '-'}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground italic">
                                                    {task.created_at ? formatDateTime(task.created_at) : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link 
                                                    to="/admin/fleet/monitoring" 
                                                    search={{ task_id: task.id }}
                                                    className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                                    title={t('track_on_map') || 'Track on Map'}
                                                >
                                                    <MapPin className="size-4" />
                                                </Link>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8">
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem className="gap-2" onClick={() => handleEdit(task)}>
                                                            <Edit2 className="size-4" />
                                                            <span>{t('edit_task') || 'Edit Task'}</span>
                                                        </DropdownMenuItem>
                                                        
                                                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="gap-2 text-destructive focus:text-destructive" 
                                                                    onClick={() => handleCancel(task)}
                                                                >
                                                                    <XCircle className="size-4" />
                                                                    <span>{t('cancel_task') || 'Cancel Task'}</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <TaskDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                task={selectedTask}
            />
        </div>
    );
};

export default TaskListPage;
