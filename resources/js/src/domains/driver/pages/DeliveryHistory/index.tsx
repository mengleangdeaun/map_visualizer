import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverDeliveryHistory } from '../../hooks/useDriverDeliveryHistory';
import { useHeaderStore } from '../../store/useHeaderStore';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HistoryCard } from './components/HistoryCard';
import { HistoryFilterSheet } from './components/HistoryFilterSheet';
import { StopsDrawer } from './components/StopsDrawer';
import { HistoricalRoute } from './types';
import { Button } from '@/components/ui/button';
import { 
    Calendar, 
    SlidersHorizontal, 
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DeliveryHistoryPage = () => {
    const { t } = useTranslation(['driver', 'delivery', 'system']);
    const setHeader = useHeaderStore(s => s.setHeader);

    // Current page state
    const [page, setPage] = useState(1);

    // Bottom Sheet filter state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Active filter state
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Drawer state for route stops timeline
    const [selectedRoute, setSelectedRoute] = useState<HistoricalRoute | null>(null);
    const [isStopsDrawerOpen, setIsStopsDrawerOpen] = useState(false);

    // Fetch historical routes matching filters and page
    const { data: historyResponse, isLoading, isFetching, refetch } = useDriverDeliveryHistory({
        page,
        date: filterDate || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
    });

    const routes = historyResponse?.data || [];
    const pagination = historyResponse; // paginated metadata matches response fields
    const totalPages = pagination?.last_page || 1;
    const hasActiveFilters = filterDate !== '' || filterStatus !== 'all';

    // Register MobileHeader configuration on mount and update when filters change
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
            )
        });
        return () => setHeader({});
    }, [setHeader, t, hasActiveFilters, filterDate, filterStatus]);

    // Apply filters from Bottom Sheet
    const handleApplyFilters = (date: string, status: string) => {
        setFilterDate(date);
        setFilterStatus(status);
        setPage(1); // Reset to page 1 on new filter
    };

    // Reset filters
    const handleResetFilters = () => {
        setFilterDate('');
        setFilterStatus('all');
        setPage(1);
    };

    // React Virtualizer setup for list items recycling
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: routes.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 156, // Optimized height to keep scrolling dynamic & smooth
        overscan: 5,
    });

    // View Route Stops drawer handler
    const handleViewStops = (route: HistoricalRoute) => {
        setSelectedRoute(route);
        setIsStopsDrawerOpen(true);
        if ('vibrate' in navigator) navigator.vibrate(15);
    };

    // Scroll to top of list on page change
    useEffect(() => {
        if (parentRef.current) {
            parentRef.current.scrollTop = 0;
        }
    }, [page]);

    return (
        <PullToRefresh onRefresh={async () => { await refetch(); }}>
            <div className="p-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)]">
                
                {/* Active Filters Summary Strip */}
                {hasActiveFilters && (
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-2xl px-4 py-2 shrink-0">
                        <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                            <SlidersHorizontal size={12} />
                            {t('driver:active_filters') || 'Active Filters'}
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

                {/* Loading / Fetching overlay indicator (non-blocking) */}
                {isFetching && !isLoading && (
                    <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-muted-foreground bg-muted/20 py-1 rounded-lg shrink-0">
                        <Loader2 size={12} className="animate-spin text-primary" />
                        <span>{t('driver:syncing_history') || 'Syncing history...'}</span>
                    </div>
                )}

                {/* Main scroll list / states */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col gap-3.5">
                        {[1, 2, 3].map(idx => (
                            <div key={idx} className="h-[156px] w-full animate-pulse bg-white border border-gray-100 rounded-2xl" />
                        ))}
                    </div>
                ) : routes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card/40 border border-dashed border-gray-200 rounded-2xl my-6">
                        <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center mb-3.5 text-muted-foreground/60">
                            <Calendar size={28} />
                        </div>
                        <h3 className="text-sm font-black tracking-tight mb-1">{t('driver:no_history_found') || 'No History Found'}</h3>
                        <p className="text-[11px] text-muted-foreground max-w-[220px] leading-relaxed font-semibold">
                            {hasActiveFilters 
                                ? t('driver:try_adjusting_filters') || 'No records match your selected filter criteria.' 
                                : t('driver:no_history_desc') || 'Your completed or active route runs will appear here.'}
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
                    /* Performance Virtualized Scroll list Container */
                    <div 
                        ref={parentRef} 
                        className="flex-1 overflow-y-auto w-full px-0.5 select-none"
                    >
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
                                        <HistoryCard 
                                            route={route} 
                                            onViewStops={handleViewStops} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Styled Pagination Footer */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-3 bg-background shrink-0 px-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl text-xs font-bold gap-1 active:scale-95 transition-all"
                            onClick={() => {
                                setPage(prev => Math.max(1, prev - 1));
                                if ('vibrate' in navigator) navigator.vibrate(10);
                            }}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={14} />
                            <span>{t('driver:prev') || 'Prev'}</span>
                        </Button>

                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {t('driver:page') || 'Page'} {page} / {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl text-xs font-bold gap-1 active:scale-95 transition-all"
                            onClick={() => {
                                setPage(prev => Math.min(totalPages, prev + 1));
                                if ('vibrate' in navigator) navigator.vibrate(10);
                            }}
                            disabled={page === totalPages}
                        >
                            <span>{t('driver:next') || 'Next'}</span>
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                )}

                {/* Filtering Bottom Sheet */}
                <HistoryFilterSheet 
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    initialDate={filterDate}
                    initialStatus={filterStatus}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                />

                {/* Stops Timeline Drill-Down Drawer */}
                <StopsDrawer 
                    isOpen={isStopsDrawerOpen}
                    onClose={() => setIsStopsDrawerOpen(false)}
                    route={selectedRoute}
                />

            </div>
        </PullToRefresh>
    );
};

export default DeliveryHistoryPage;
