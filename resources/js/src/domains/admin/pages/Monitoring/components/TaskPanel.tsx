import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Search, Filter, ClipboardList, MapPin, User, Clock, MoreVertical, ExternalLink, Truck, Edit2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUpdateTask, useTasks } from '@/domains/admin/pages/Tasks/hooks/useTasks';
import { TaskStatus } from '@/domains/admin/pages/Tasks/services/taskService';
import { getTaskStatusColor } from '@/domains/admin/pages/Tasks/utils/taskStatus';
import TaskDialog from '@/domains/admin/pages/Tasks/components/TaskDialog';

interface TaskPanelProps {
    onFocusTarget?: (target: { id: string; type: 'vehicle' | 'hub' | 'task'; center: [number, number] }) => void;
}

export const TaskPanel = ({ onFocusTarget }: TaskPanelProps) => {
    const { t } = useTranslation('admin');
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const { data: tasksData, isLoading } = useTasks({ 
        search, 
        per_page: 50,
        status: 'active' // Fetch active tasks only
    });

    const updateMutation = useUpdateTask();

    const handleTaskClick = (task: any) => {
        if (task.vehicle && task.vehicle.latitude && task.vehicle.longitude) {
            onFocusTarget?.({
                id: task.vehicle.id,
                type: 'vehicle',
                center: [Number(task.vehicle.longitude), Number(task.vehicle.latitude)]
            });
        } else if (task.pickup_lat && task.pickup_lng) {
            onFocusTarget?.({
                id: task.id,
                type: 'task',
                center: [Number(task.pickup_lng), Number(task.pickup_lat)]
            });
        }
    };

    const handleEditClick = (e: React.MouseEvent, task: any) => {
        e.stopPropagation();
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleCancelTask = async (e: React.MouseEvent, task: any) => {
        e.stopPropagation();
        if (confirm(t('confirm_cancel_task', 'Are you sure you want to cancel this task?'))) {
            try {
                await updateMutation.mutateAsync({ 
                    id: task.id, 
                    data: { ...task, status: 'cancelled' } 
                });
            } catch (error) {}
        }
    };


    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent min-h-0">
            <div className="p-4 pt-0 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ClipboardList className="size-4 text-primary" />
                        </div>
                        <h2 className="font-bold text-sm tracking-tight">{t('active_tasks') || 'Active Tasks'}</h2>
                    </div>
                    <Button size="sm" className="h-8 gap-1 shadow-sm" onClick={() => {
                        setSelectedTask(null);
                        setIsDialogOpen(true);
                    }}>
                        <Plus className="size-3" />
                        {t('new_task') || 'New Task'}
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input 
                        placeholder={t('search_tasks') || 'Search ID or title...'} 
                        className="pl-9 h-9 text-xs"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 h-full min-h-0">
                <div className="p-4 space-y-3 pt-0">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                        ))
                    ) : tasksData?.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                            <div className="p-3 bg-muted/50 rounded-full">
                                <ClipboardList className="size-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">{t('no_tasks_found') || 'No tasks found'}</p>
                        </div>
                    ) : (
                        tasksData?.data.map((task) => (
                            <div 
                                key={task.id}
                                className={cn(
                                    "group relative p-3 rounded-xl border bg-card transition-all cursor-pointer hover:shadow-md hover:border-primary/20",
                                    task.status === 'in_progress' && "border-primary/30 ring-1 ring-primary/5"
                                )}
                                onClick={() => handleTaskClick(task)}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                                                    {task.id.substring(0, 8)}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-xs truncate leading-tight">{task.title}</h3>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="outline" className={cn("text-[9px] h-5 capitalize", getTaskStatusColor(task.status))}>
                                                {t(`status_${task.status}`) || task.status.replace('_', ' ')}
                                            </Badge>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical className="size-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="gap-2" onClick={(e) => handleEditClick(e as any, task)}>
                                                        <Edit2 className="size-3.5" />
                                                        <span>{t('edit_task') || 'Edit Task'}</span>
                                                    </DropdownMenuItem>
                                                    
                                                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="gap-2 text-destructive focus:text-destructive" 
                                                                onClick={(e) => handleCancelTask(e, task)}
                                                            >
                                                                <XCircle className="size-3.5" />
                                                                <span>{t('cancel_task') || 'Cancel Task'}</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="size-3 shrink-0 text-primary/60" />
                                            <span className="text-[10px] w-36 !truncate">{task.dropoff_address || t('no_address')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="size-3 shrink-0" />
                                                <span className="text-[10px] font-medium truncate">{task.contact_name || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {task.vehicle && (
                                                    <Badge variant="secondary" className="h-5 text-[9px] gap-1 px-1.5 bg-muted/50 border-none">
                                                        <Truck className="size-2.5" />
                                                        {task.vehicle.plate_number}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <TaskDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                task={selectedTask}
            />
        </Card>
    );
};
