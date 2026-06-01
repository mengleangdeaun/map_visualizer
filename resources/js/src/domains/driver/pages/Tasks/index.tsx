import React from 'react';
import { Truck, ClipboardList } from 'lucide-react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
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
            <div className={`px-4 py-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 pb-24 ${tasks.length === 0 ? 'h-[calc(100vh-140px)]' : ''}`}>
                {/* Header Count Badge */}
                <div className="flex items-center justify-between px-1 shrink-0">
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
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-full flex flex-col items-center justify-center p-8 bg-card/20 border border-dashed border-border/80 rounded-2xl shadow-none animate-in fade-in duration-300">
                            <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground/60">
                                <ClipboardList size={22} />
                            </div>
                            <h3 className="text-sm font-bold text-foreground tracking-tight mb-1 text-center">
                                {t('driver:no_tasks_assigned') || 'No Tasks Assigned'}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-[210px] leading-relaxed text-center">
                                {t('driver:no_tasks_desc') || 'Your currently assigned delivery routes and duties will appear here.'}
                            </p>
                        </div>
                    </div>
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
