import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverTasks, useUpdateTaskStatus } from '../../hooks/useDriverTasks';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '../../store/useHeaderStore';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '@/lib/echo';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
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
    const { data: tasksData, isLoading, refetch } = useDriverTasks();
    const updateStatusMutation = useUpdateTaskStatus();
    const setHeader = useHeaderStore(s => s.setHeader);

    useEffect(() => {
        setHeader({ 
            title: t('driver:tasks') || 'My Tasks',
            showBackButton: true,
            backTarget: '/driver'
        });
        return () => setHeader({});
    }, [setHeader, t]);

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
        <PullToRefresh onRefresh={refetch}>
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
                    <Card key={task.id} className="overflow-hidden gap-0 border-none shadow-lg bg-card p-0">
                        {/* Task Header */}
                        <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "size-2 rounded-full",
                                    task.status === 'assigned' ? "bg-blue-500 animate-pulse" : "bg-green-500"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    {task.id.substring(0, 8)} • {task.status}
                                    {task.priority && (
                                        <span className={cn(
                                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                            task.priority === 'urgent' && "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse",
                                            task.priority === 'high' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                                            task.priority === 'normal' && "bg-slate-500/10 text-slate-600 border border-slate-500/20",
                                            task.priority === 'low' && "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                        )}>
                                            {t(`admin:${task.priority}`) || task.priority}
                                        </span>
                                    )}
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
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 mt-1">
                                        <MapPin size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{t('driver:pickup') || 'Pickup'}</span>
                                        {task.pickup_lat && task.pickup_lng ? (
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${task.pickup_lat},${task.pickup_lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold leading-snug hover:text-primary hover:underline transition-colors flex items-center gap-1 group"
                                                title="Open in Google Maps"
                                            >
                                                {task.pickup_address}
                                                <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary">↗</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs font-bold leading-snug">{task.pickup_address}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-1">
                                        <Navigation size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{t('driver:dropoff') || 'Drop-off'}</span>
                                        {task.dropoff_lat && task.dropoff_lng ? (
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${task.dropoff_lat},${task.dropoff_lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold leading-snug hover:text-primary hover:underline transition-colors flex items-center gap-1 group"
                                                title="Open in Google Maps"
                                            >
                                                {task.dropoff_address}
                                                <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary">↗</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs font-bold leading-snug">{task.dropoff_address}</span>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-medium">{task.contact_name}</span>
                                            <span className="text-[11px] text-muted-foreground">• {task.contact_phone}</span>
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
                                    if (task.contact_phone) {
                                        window.location.href = `tel:${task.contact_phone}`;
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
                                {(updateStatusMutation.isPending && updateStatusMutation.variables?.taskId === task.id) ? (
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
        </PullToRefresh>
    );
};

export default TaskListPage;
