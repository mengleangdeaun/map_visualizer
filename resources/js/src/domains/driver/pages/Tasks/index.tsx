import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverTasks, useUpdateTaskStatus } from '../../hooks/useDriverTasks';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '@/lib/echo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    MapPin, 
    Phone, 
    ChevronRight, 
    Clock, 
    CheckCircle, 
    Navigation,
    Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TaskListPage = () => {
    const { t } = useTranslation(['driver', 'system']);
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { data: tasksData, isLoading } = useDriverTasks();
    const updateStatusMutation = useUpdateTaskStatus();

    // Real-time listener for task updates/assignments
    useEffect(() => {
        if (!user?.id) return;

        const channelName = `App.Models.User.${user.id}`;
        
        echo.private(channelName)
            .listen('.task.updated', (e: any) => {
                // Refresh the task list when a task assigned to this driver is updated
                queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            });

        return () => {
            echo.leave(channelName);
        };
    }, [user?.id, queryClient]);

    const handleStatusChange = (taskId: string, currentStatus: string) => {
        let nextStatus = '';
        if (currentStatus === 'assigned' || currentStatus === 'pending') nextStatus = 'in_progress';
        else if (currentStatus === 'in_progress') nextStatus = 'completed';

        if (nextStatus) {
            updateStatusMutation.mutate({ taskId, status: nextStatus });
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    const tasks = tasksData?.data || [];

    return (
        <div className="p-4 flex flex-col gap-4 pb-20">
            <div className="flex items-center justify-between px-1">
                <h1 className="text-xl font-black tracking-tight">{t('driver:my_tasks') || 'My Tasks'}</h1>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase">
                    {tasks.length} {t('driver:active') || 'Active'}
                </span>
            </div>

            {tasks.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border-dashed border-2 bg-muted/5">
                    <Truck size={40} className="opacity-20" />
                    <p className="text-sm font-medium italic">{t('driver:no_tasks_assigned') || 'No tasks assigned yet.'}</p>
                </Card>
            ) : (
                tasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden border-none shadow-lg bg-card">
                        {/* Task Header */}
                        <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "size-2 rounded-full",
                                    task.status === 'assigned' ? "bg-blue-500 animate-pulse" : "bg-green-500"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {task.id.substring(0, 8)} • {task.status}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">
                                {task.created_at ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(task.created_at)) : '--:--'}
                            </span>
                        </div>

                        {/* Task Body */}
                        <div className="p-4 space-y-4">
                            <div className="flex flex-col">
                                <h3 className="font-black text-lg leading-tight">{task.title}</h3>
                                <p className="text-[11px] text-muted-foreground font-medium">{task.customer?.name}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 mt-1">
                                        <MapPin size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{t('driver:pickup') || 'Pickup'}</span>
                                        <span className="text-xs font-bold leading-snug">{task.pickup_address}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-1">
                                        <Navigation size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{t('driver:dropoff') || 'Drop-off'}</span>
                                        <span className="text-xs font-bold leading-snug">{task.dropoff_address}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-medium">{task.receiver_name}</span>
                                            <span className="text-[11px] text-muted-foreground">• {task.receiver_phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task Footer / Actions */}
                        <div className="p-4 bg-muted/20 border-t border-border/50 flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-10 font-black uppercase text-[10px] tracking-widest gap-2"
                                onClick={() => {
                                    if (task.receiver_phone) {
                                        window.location.href = `tel:${task.receiver_phone}`;
                                    }
                                }}
                            >
                                <Phone size={14} />
                                {t('driver:call') || 'Call'}
                            </Button>
                            
                            <Button 
                                size="sm" 
                                className={cn(
                                    "flex-1 h-10 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg transition-all",
                                    task.status === 'assigned' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                                )}
                                onClick={() => handleStatusChange(task.id, task.status)}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? (
                                    <Clock className="size-4 animate-spin" />
                                ) : (task.status === 'assigned' || task.status === 'pending') ? (
                                    <>
                                        <Navigation size={14} />
                                        {t('driver:start_task') || 'Start'}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} />
                                        {t('driver:complete') || 'Complete'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
};

export default TaskListPage;
