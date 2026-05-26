import React from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
    MapPin, ChevronRight, Package, PackageOpen,
    Clock, CheckCircle2, AlertCircle, Ban,
} from 'lucide-react';
import type { Task, TaskStatus } from '@/domains/admin/pages/Tasks/services/taskService';

// ─── Priority config ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    urgent: {
        label: 'Urgent',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse',
    },
    high: {
        label: 'High',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    normal: {
        label: 'Normal',
        className: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
    },
    low: {
        label: 'Low',
        className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
} as const;

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ReactNode; label: string; dot: string }> = {
    pending:     { icon: <Clock size={11} />,        label: 'Pending',     dot: 'bg-slate-400' },
    assigned:    { icon: <Package size={11} />,      label: 'Assigned',    dot: 'bg-blue-400' },
    in_progress: { icon: <PackageOpen size={11} />,  label: 'In Progress', dot: 'bg-primary animate-pulse' },
    completed:   { icon: <CheckCircle2 size={11} />, label: 'Completed',   dot: 'bg-emerald-400' },
    cancelled:   { icon: <Ban size={11} />,          label: 'Cancelled',   dot: 'bg-rose-400' },
    archived:    { icon: <Ban size={11} />,          label: 'Archived',    dot: 'bg-muted-foreground' },
    rescheduled: { icon: <Clock size={11} />,        label: 'Rescheduled', dot: 'bg-amber-400' },
};

// ─── TaskRow ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
    task: Task;
    isFirst?: boolean;
}

const TaskRow = ({ task, isFirst }: TaskRowProps) => {
    const { t } = useTranslation('driver');
    const priority = task.priority ? PRIORITY_CONFIG[task.priority] : null;
    const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG['pending'];
    const isActive = task.status === 'in_progress';

    return (
        <Link to="/driver/tasks">
            <div
                className={cn(
                    'group relative flex items-center gap-3.5 rounded-2xl border-none px-4 py-3.5',
                    'transition-all duration-150 active:scale-[0.985]',
                    isActive
                        ? 'bg-primary/8 border-primary/25 shadow-sm'
                        : 'bg-card hover:border-primary/20 hover:bg-primary/5',
                )}
            >
                {/* Left: icon blob */}
                <div className={cn(
                    'size-11 shrink-0 rounded-2xl flex items-center justify-center',
                    isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors',
                )}>
                    {isActive
                        ? <PackageOpen size={20} />
                        : <Package size={20} />
                    }
                </div>

                {/* Middle: info */}
                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                            'text-sm font-black tracking-tight truncate',
                            isActive && 'text-primary',
                        )}>
                            {task.title}
                        </span>
                        {priority && (
                            <span className={cn(
                                'shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full',
                                'uppercase tracking-wider border leading-none',
                                priority.className,
                            )}>
                                {t(`priority_${task.priority}`, { defaultValue: priority.label })}
                            </span>
                        )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        {/* Status dot + label */}
                        <span className="flex items-center gap-1">
                            <span className={cn('size-1.5 rounded-full shrink-0', status.dot)} />
                            {t(`task_status_${task.status}`, { defaultValue: status.label })}
                        </span>

                        {task.contact_name && (
                            <>
                                <span className="opacity-30">•</span>
                                <span className="truncate">{task.contact_name}</span>
                            </>
                        )}

                        {task.dropoff_address && (
                            <>
                                <span className="opacity-30">•</span>
                                <span className="flex items-center gap-0.5 truncate">
                                    <MapPin size={9} className="shrink-0" />
                                    <span className="truncate">{task.dropoff_address}</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: chevron */}
                <ChevronRight
                    size={15}
                    className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors"
                />

                {/* Active tracking indicator bar */}
                {isActive && (
                    <span className="absolute left-0 inset-y-3 w-0.5 rounded-r-full bg-primary" />
                )}
            </div>
        </Link>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyTasks = () => {
    const { t } = useTranslation('driver');
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                <Package size={26} className="text-muted-foreground/30" />
            </div>
            <div className="text-center">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                    {t('no_active_tasks', { defaultValue: 'No Tasks' })}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5 italic">
                    {t('no_tasks_desc', { defaultValue: 'Deliveries assigned to you will appear here.' })}
                </p>
            </div>
        </div>
    );
};

// ─── TasksSection (main export) ───────────────────────────────────────────────

interface TasksSectionProps {
    tasks: Task[];
    isLoading?: boolean;
}

export const TasksSection = ({ tasks, isLoading }: TasksSectionProps) => {
    const { t } = useTranslation('driver');

    // Show the in-progress task first, then others up to 3 total
    const sorted = [...tasks].sort((a, b) => {
        if (a.status === 'in_progress') return -1;
        if (b.status === 'in_progress') return 1;
        return 0;
    });
    const visible = sorted.slice(0, 3);
    const hiddenCount = tasks.length - visible.length;

    return (
        <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {t('upcoming_deliveries', { defaultValue: 'Upcoming Deliveries' })}
                    </span>
                    {tasks.length > 0 && (
                        <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
                            {tasks.length}
                        </span>
                    )}
                </div>
                <Link
                    to="/driver/tasks"
                    className="flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                >
                    {t('view_all', { defaultValue: 'View All' })}
                    <ChevronRight size={11} />
                </Link>
            </div>

            {/* Content */}
            {isLoading ? (
                // Skeleton
                <div className="flex flex-col gap-2.5">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-[72px] rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <EmptyTasks />
            ) : (
                <div className="flex flex-col gap-2.5">
                    {visible.map((task, i) => (
                        <TaskRow key={task.id} task={task} isFirst={i === 0} />
                    ))}

                    {/* "+N more" overflow link */}
                    {hiddenCount > 0 && (
                        <Link to="/driver/tasks">
                            <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-dashed border-border/60 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-primary hover:border-primary/30 transition-colors">
                                <AlertCircle size={11} />
                                +{hiddenCount} more {hiddenCount === 1 ? 'task' : 'tasks'}
                            </div>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};
