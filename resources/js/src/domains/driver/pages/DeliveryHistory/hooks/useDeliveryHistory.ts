import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDriverDeliveryHistory } from '@/domains/driver/hooks/useDriverDeliveryHistory';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import { HistoricalRoute } from '../types';

export const useDeliveryHistory = () => {
  const { t } = useTranslation();
  const setHeader = useHeaderStore((s) => s.setHeader);

  // Pagination
  const [page, setPage] = useState(1);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Stops drawer state
  const [selectedRoute, setSelectedRoute] = useState<HistoricalRoute | null>(null);
  const [isStopsDrawerOpen, setIsStopsDrawerOpen] = useState(false);

  const { data: historyResponse, isLoading, isFetching, refetch } = useDriverDeliveryHistory({
    page,
    date: filterDate || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const routes = historyResponse?.data || [];
  const totalPages = historyResponse?.last_page || 1;
  const hasActiveFilters = filterDate !== '' || filterStatus !== 'all';

  const handleApplyFilters = useCallback((date: string, status: string) => {
    setFilterDate(date);
    setFilterStatus(status);
    setPage(1);
    if ('vibrate' in navigator) navigator.vibrate(15);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterDate('');
    setFilterStatus('all');
    setPage(1);
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, []);

  const handleViewStops = useCallback((route: HistoricalRoute) => {
    setSelectedRoute(route);
    setIsStopsDrawerOpen(true);
    if ('vibrate' in navigator) navigator.vibrate(15);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, []);

  const handleNextPage = useCallback((total: number) => {
    setPage((prev) => Math.min(total, prev + 1));
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, []);

  // Virtualizer
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: routes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 192,
    overscan: 5,
  });

  // Scroll to top on page change
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [page]);

  return {
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
  };
};
