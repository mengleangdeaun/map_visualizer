import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverTasks } from '../../hooks/useDriverTasks';
import { useHeaderStore } from '../../store/useHeaderStore';
import { PullToRefresh } from '../../components/PullToRefresh';
import { BottomSheet } from '../../components/BottomSheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    XCircle, 
    SlidersHorizontal, 
    MapPin, 
    Clock, 
    RotateCcw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TaskHistoryPage = () => {
    const { t } = useTranslation(['driver', 'system']);
    const setHeader = useHeaderStore(s => s.setHeader);
    
    // Bottom Sheet filter state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempDate, setTempDate] = useState('');
    const [tempPriority, setTempPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [tempStatus, setTempStatus] = useState<'all' | 'completed' | 'cancelled'>('all');
    
    // Active filter state
    const [filterDate, setFilterDate] = useState('');
    const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');

    // Fetch Completed/Cancelled tasks matching active filters
    const { data: tasksResponse, isLoading, refetch } = useDriverTasks({
        history: true,
        date: filterDate || undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
    });

    const tasks = tasksResponse?.data || [];
    const hasActiveFilters = filterDate !== '' || filterPriority !== 'all' || filterStatus !== 'all';

    // Register MobileHeader configuration on mount and when filter state changes
    useEffect(() => {
        setHeader({
            title: t('driver:task_history') || 'Task History',
            showBackButton: true,
            backTarget: '/driver/profile',
            rightAction: (
                <button 
                    onClick={() => {
                        // Prefill temporary filter states with current values when opening
                        setTempDate(filterDate);
                        setTempPriority(filterPriority);
                        setTempStatus(filterStatus);
                        setIsFilterOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors relative shrink-0"
                >
                    <SlidersHorizontal size={18} />
                    {hasActiveFilters && (
                        <span className="absolute top-1 right-1 size-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                    )}
                </button>
            )
        });
        return () => setHeader({});
    }, [setHeader, t, hasActiveFilters, filterDate, filterPriority, filterStatus]);

    // Apply Bottom Sheet filters
    const handleApplyFilters = () => {
        setFilterDate(tempDate);
        setFilterPriority(tempPriority);
        setFilterStatus(tempStatus);
        setIsFilterOpen(false);
        if ('vibrate' in navigator) navigator.vibrate(15);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setTempDate('');
        setTempPriority('all');
        setTempStatus('all');
        setFilterDate('');
        setFilterPriority('all');
        setFilterStatus('all');
        setIsFilterOpen(false);
        if ('vibrate' in navigator) navigator.vibrate(10);
    };

    // React Virtualizer setup for scrolling performance
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: tasks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 148, // Estimated pixel height of each item card
        overscan: 6,
    });

    // Color badges helper
    const getPriorityStyles = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'medium':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'low':
            default:
                return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
        }
    };

    return (
        <PullToRefresh onRefresh={async () => { await refetch(); }}>
            <div className="p-4 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)]">
                
                {/* Visual active filters alert strip */}
                {hasActiveFilters && (
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-3.5 py-2">
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                            <SlidersHorizontal size={12} />
                            {t('driver:active_filters') || 'Active filters applied'}
                        </span>
                        <button 
                            onClick={handleResetFilters}
                            className="text-[9px] font-black uppercase text-primary/80 hover:text-primary flex items-center gap-1"
                        >
                            <RotateCcw size={10} />
                            {t('driver:clear') || 'Clear'}
                        </button>
                    </div>
                )}

                {/* Loading Shimmer View */}
                {isLoading ? (
                    <div className="flex flex-col gap-3.5">
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className="h-[136px] w-full animate-pulse bg-card/60 border rounded-2xl" />
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    /* Zero State Empty View */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card/40 border border-dashed rounded-2xl my-6">
                        <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-3.5 text-muted-foreground/60">
                            <Calendar size={28} />
                        </div>
                        <h3 className="text-sm font-black tracking-tight mb-1">{t('driver:no_history_found') || 'No History Found'}</h3>
                        <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
                            {hasActiveFilters 
                                ? t('driver:try_adjusting_filters') || 'No records match your selected filter criteria.' 
                                : t('driver:no_history_desc') || 'Your completed or cancelled assignments will show up here.'}
                        </p>
                        {hasActiveFilters && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-4 rounded-xl font-bold text-[10px] h-9 px-4"
                                onClick={handleResetFilters}
                            >
                                {t('driver:reset_filters') || 'Reset Filters'}
                            </Button>
                        )}
                    </div>
                ) : (
                    /* High Performance Virtualized Scroll Container */
                    <div 
                        ref={parentRef} 
                        className="flex-1 overflow-y-auto w-full pr-1 select-none scrollbar-thin"
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const task = tasks[virtualRow.index];
                                if (!task) return null;

                                const formattedDate = task.scheduled_at 
                                    ? new Date(task.scheduled_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'No Date';

                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        className="py-1.5"
                                    >
                                        <Card className="p-4 border bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all rounded-2xl flex flex-col gap-3 h-full justify-between">
                                            {/* Top: Customer & Priority Badge */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none mb-1">
                                                        {task.contact_name || 'Anonymous Customer'}
                                                    </span>
                                                    <span className="text-sm font-bold tracking-tight text-foreground leading-snug truncate">
                                                        {task.title || 'Untitled Delivery Task'}
                                                    </span>
                                                </div>
                                                
                                                {/* Task Priority & Status Badges */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-full",
                                                        getPriorityStyles(task.priority)
                                                    )}>
                                                        {task.priority || 'LOW'}
                                                    </span>
                                                    
                                                    {task.status === 'completed' ? (
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center gap-0.5">
                                                            <CheckCircle2 size={8} />
                                                            {t('driver:completed') || 'Done'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full flex items-center gap-0.5">
                                                            <XCircle size={8} />
                                                            {t('driver:cancelled') || 'Void'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Middle: Addresses */}
                                            <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-muted/30">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <MapPin size={11} className="text-primary shrink-0" />
                                                    <span className="truncate">{task.pickup_address || 'No pickup address'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-0 border-t pt-1.5 border-muted/40">
                                                    <MapPin size={11} className="text-muted-foreground shrink-0" />
                                                    <span className="truncate">{task.dropoff_address || 'No dropoff address'}</span>
                                                </div>
                                            </div>

                                            {/* Bottom: Date Time stamp & Details */}
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold border-t pt-2.5">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {formattedDate}
                                                </span>
                                                {task.vehicle?.plate_number && (
                                                    <span className="bg-muted px-2 py-0.5 rounded font-black tracking-wide">
                                                        {task.vehicle.plate_number}
                                                    </span>
                                                )}
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Date & Priority Filtering Bottom Sheet */}
                <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b pb-3.5">
                        <h2 className="text-sm font-black tracking-tight text-foreground flex items-center gap-2">
                            <SlidersHorizontal size={16} className="text-primary" />
                            {t('driver:filter_tasks') || 'Filter Task History'}
                        </h2>
                        <button 
                            onClick={handleResetFilters}
                            className="text-[10px] font-black uppercase text-destructive hover:text-destructive/80 transition-colors"
                        >
                            {t('driver:reset_all') || 'Reset All'}
                        </button>
                    </div>

                    {/* Filter Segment 1: Date */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            {t('driver:filter_by_date') || 'Filter by Date'}
                        </label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={tempDate}
                                onChange={(e) => setTempDate(e.target.value)}
                                className="w-full h-10 rounded-xl border bg-background px-3.5 text-xs font-black tracking-tight text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Filter Segment 2: Status */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            {t('driver:filter_by_status') || 'Filter by Status'}
                        </label>
                        <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1 rounded-xl">
                            {([
                                { code: 'all', label: t('driver:all') || 'All' },
                                { code: 'completed', label: t('driver:completed') || 'Done' },
                                { code: 'cancelled', label: t('driver:cancelled') || 'Void' }
                            ] as const).map((stat) => (
                                <button
                                    key={stat.code}
                                    type="button"
                                    onClick={() => setTempStatus(stat.code)}
                                    className={cn(
                                        "py-2 rounded-lg text-xs font-black transition-all",
                                        tempStatus === stat.code 
                                            ? "bg-background text-primary shadow-sm border border-border" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {stat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter Segment 3: Priority */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            {t('driver:filter_by_priority') || 'Filter by Priority'}
                        </label>
                        <div className="grid grid-cols-4 gap-2 bg-muted/30 p-1 rounded-xl">
                            {([
                                { code: 'all', label: t('driver:all') || 'All' },
                                { code: 'low', label: t('driver:priority_low') || 'Low' },
                                { code: 'medium', label: t('driver:priority_medium') || 'Med' },
                                { code: 'high', label: t('driver:priority_high') || 'High' }
                            ] as const).map((prio) => (
                                <button
                                    key={prio.code}
                                    type="button"
                                    onClick={() => setTempPriority(prio.code)}
                                    className={cn(
                                        "py-2 rounded-lg text-[10px] font-black transition-all",
                                        tempPriority === prio.code 
                                            ? "bg-background text-primary shadow-sm border border-border" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {prio.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buttons: Apply / Close */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-wider"
                            onClick={() => setIsFilterOpen(false)}
                        >
                            {t('driver:close') || 'Close'}
                        </Button>
                        <Button 
                            className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                            onClick={handleApplyFilters}
                        >
                            {t('driver:apply_filters') || 'Apply Filters'}
                        </Button>
                    </div>
                </BottomSheet>

            </div>
        </PullToRefresh>
    );
};

export default TaskHistoryPage;
