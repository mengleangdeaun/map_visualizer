import React from 'react';
import { Truck } from 'lucide-react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { useTasks } from './hooks/useTasks';
import { TaskCard } from './components/TaskCard';
import { TasksSkeleton } from './components/TasksSkeleton';

const TaskListPage = React.memo(() => {
    const {
        t,
        tasks,
        isLoading,
        refetch,
        handleStatusChange,
        isUpdating,
        updatingTaskId
    } = useTasks();

    return (
        <PullToRefresh onRefresh={async () => { await refetch(); }}>
            <div className="px-4 py-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 pb-24">
                {/* Header Count Badge */}
                <div className="flex items-center justify-between px-1">
                    <h1 className="text-lg font-black tracking-tight text-gray-800">
                        {t('driver:my_tasks') || 'My Tasks'}
                    </h1>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {tasks.length} {t('driver:active') || 'Active'}
                    </span>
                </div>

                {/* Main Views */}
                {isLoading ? (
                    <TasksSkeleton />
                ) : tasks.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3.5 border-dashed border-2 bg-gray-50/50 rounded-2xl select-none">
                        <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground/50">
                            <Truck size={28} />
                        </div>
                        <div className="text-center flex flex-col gap-1 max-w-[240px]">
                            <h3 className="text-sm font-black tracking-tight text-gray-800">
                                {t('driver:no_tasks_assigned') || 'No Tasks Assigned'}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {t('driver:no_tasks_desc') || 'Your currently assigned delivery routes and duties will appear here.'}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3.5 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                t={t}
                                onStatusChange={handleStatusChange}
                                isUpdating={isUpdating}
                                updatingTaskId={updatingTaskId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
});

TaskListPage.displayName = 'TaskListPage';

export default TaskListPage;
