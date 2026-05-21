import React, { useEffect } from 'react';
import { Calendar, SlidersHorizontal } from 'lucide-react';
import { PullToRefresh } from '../../components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { useTaskHistory } from './hooks/useTaskHistory';
import { ActiveFilterAlert } from './components/ActiveFilterAlert';
import { TaskHistoryCard } from './components/TaskHistoryCard';
import { FilterSheet } from './components/FilterSheet';
import { TaskHistorySkeleton } from './components/TaskHistorySkeleton';

const TaskHistoryPage = React.memo(() => {
  const {
    t,
    tasks,
    isLoading,
    refetch,
    hasActiveFilters,
    isFilterOpen,
    tempDate,
    tempPriority,
    tempStatus,
    setTempDate,
    setTempPriority,
    setTempStatus,
    handleOpenFilters,
    handleCloseFilters,
    handleApplyFilters,
    handleResetFilters,
    parentRef,
    rowVirtualizer,
    setHeader,
  } = useTaskHistory();

  // Register MobileHeader configuration on mount and when filter state changes
  useEffect(() => {
    setHeader({
      title: t('driver:task_history') || 'Task History',
      showBackButton: true,
      backTarget: '/driver/profile',
      rightAction: (
        <button
          onClick={handleOpenFilters}
          className="p-2 text-muted-foreground hover:text-primary transition-colors relative shrink-0"
        >
          <SlidersHorizontal size={18} />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 size-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
          )}
        </button>
      ),
    });
    return () => setHeader({});
  }, [setHeader, t, hasActiveFilters, handleOpenFilters]);

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <div className="px-4 py-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)]">
        {/* Visual active filters alert strip */}
        <ActiveFilterAlert
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
          t={t}
        />

        {/* Loading Shimmer View */}
        {isLoading ? (
          <TaskHistorySkeleton />
        ) : tasks.length === 0 ? (
          /* Zero State Empty View */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card/40 border border-dashed rounded-2xl my-6">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-3.5 text-muted-foreground/60">
              <Calendar size={28} />
            </div>
            <h3 className="text-sm font-black tracking-tight mb-1">
              {t('driver:no_history_found') || 'No History Found'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              {hasActiveFilters
                ? t('driver:try_adjusting_filters') ||
                  'No records match your selected filter criteria.'
                : t('driver:no_history_desc') ||
                  'Your completed or cancelled assignments will show up here.'}
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
            className="flex-1 overflow-y-auto w-full px-1 select-none"
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
                    <TaskHistoryCard task={task} t={t} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Date & Priority Filtering Bottom Sheet (Lazy Mounted) */}
        {isFilterOpen && (
          <FilterSheet
            isOpen={isFilterOpen}
            onClose={handleCloseFilters}
            tempDate={tempDate}
            tempStatus={tempStatus}
            tempPriority={tempPriority}
            setTempDate={setTempDate}
            setTempStatus={setTempStatus}
            setTempPriority={setTempPriority}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            t={t}
          />
        )}
      </div>
    </PullToRefresh>
  );
});

TaskHistoryPage.displayName = 'TaskHistoryPage';

export default TaskHistoryPage;
