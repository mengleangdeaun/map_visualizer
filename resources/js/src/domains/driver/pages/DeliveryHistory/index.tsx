import React, { useEffect, useCallback } from 'react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { SlidersHorizontal, Calendar, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeliveryHistory } from './hooks/useDeliveryHistory';
import { HistoryCard } from './components/HistoryCard';
import { HistoryFilterSheet } from './components/HistoryFilterSheet';
import { StopsDrawer } from './components/StopsDrawer';
import { DeliveryHistorySkeleton } from './components/DeliveryHistorySkeleton';

const DeliveryHistoryPage = React.memo(() => {
  const {
    t,
    setHeader,
    page,
    routes,
    totalPages,
    isLoading,
    isFetching,
    refetch,
    hasActiveFilters,
    filterDate,
    filterStatus,
    isFilterOpen,
    setIsFilterOpen,
    selectedRoute,
    isStopsDrawerOpen,
    setIsStopsDrawerOpen,
    handleApplyFilters,
    handleResetFilters,
    handleViewStops,
    handlePrevPage,
    handleNextPage,
    parentRef,
    rowVirtualizer,
  } = useDeliveryHistory();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    setHeader({
      title: t('driver:delivery_history') || 'Delivery History',
      showBackButton: true,
      backTarget: '/driver/profile',
      rightAction: (
        <button
          onClick={() => setIsFilterOpen(true)}
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
  }, [setHeader, t, hasActiveFilters, setIsFilterOpen]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="px-4 py-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)]">

        {/* Active Filters Strip */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-2xl px-4 py-2 shrink-0">
            <span className="text-[10px] font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <SlidersHorizontal size={12} />
              {t('driver:active_filters') || 'Active Filters'}
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[9px] font-bold uppercase text-primary/80 hover:text-primary flex items-center gap-1 active:scale-95 transition-transform"
            >
              <RotateCcw size={10} />
              {t('driver:clear') || 'Clear'}
            </button>
          </div>
        )}

        {/* Syncing indicator (non-blocking) */}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 justify-center text-[10px] font-semibold text-gray-400 bg-gray-100 py-1.5 rounded-xl shrink-0">
            <Loader2 size={12} className="animate-spin text-primary" />
            <span>{t('driver:syncing_history') || 'Syncing...'}</span>
          </div>
        )}

        {/* Main Content */}
        {isLoading ? (
          <DeliveryHistorySkeleton />
        ) : routes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white shadow-sm rounded-2xl">
            <div className="size-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3.5 text-gray-400">
              <Calendar size={28} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 tracking-tight mb-1">
              {t('driver:no_history_found') || 'No History Found'}
            </h3>
            <p className="text-[11px] text-gray-400 max-w-[220px] leading-relaxed font-semibold">
              {hasActiveFilters
                ? t('driver:try_adjusting_filters') || 'No records match your filters.'
                : t('driver:no_history_desc') || 'Your completed route runs will appear here.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl font-bold text-[10px] h-9 px-4 uppercase tracking-wider"
                onClick={handleResetFilters}
              >
                {t('driver:reset_filters') || 'Reset Filters'}
              </Button>
            )}
          </div>
        ) : (
          /* Virtualized Scroll Container */
          <div ref={parentRef} className="flex-1 overflow-y-auto w-full select-none">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const route = routes[virtualRow.index];
                if (!route) return null;
                return (
                  <div
                    key={virtualRow.key}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="py-1.5"
                  >
                    <HistoryCard route={route} onViewStops={handleViewStops} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0 px-1">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
              {t('driver:prev') || 'Prev'}
            </Button>

            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
              onClick={() => handleNextPage(totalPages)}
              disabled={page === totalPages}
            >
              {t('driver:next') || 'Next'}
              <ChevronRight size={14} />
            </Button>
          </div>
        )}

        {/* Filter Bottom Sheet */}
        <HistoryFilterSheet
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          initialDate={filterDate}
          initialStatus={filterStatus}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* Stops Timeline Drawer */}
        <StopsDrawer
          isOpen={isStopsDrawerOpen}
          onClose={() => setIsStopsDrawerOpen(false)}
          route={selectedRoute}
        />
      </div>
    </PullToRefresh>
  );
});

DeliveryHistoryPage.displayName = 'DeliveryHistoryPage';

export default DeliveryHistoryPage;
