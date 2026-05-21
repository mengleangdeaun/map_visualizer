import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverTasks } from '@/domains/driver/hooks/useDriverTasks';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PriorityType, StatusType, HistoryTask } from '../types';

export const useTaskHistory = () => {
  const { t } = useTranslation(['driver', 'system']);
  const setHeader = useHeaderStore((s) => s.setHeader);

  // Bottom Sheet filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempPriority, setTempPriority] = useState<PriorityType>('all');
  const [tempStatus, setTempStatus] = useState<StatusType>('all');

  // Active filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterPriority, setFilterPriority] = useState<PriorityType>('all');
  const [filterStatus, setFilterStatus] = useState<StatusType>('all');

  // Fetch Completed/Cancelled tasks matching active filters
  const { data: tasksResponse, isLoading, refetch } = useDriverTasks({
    history: true,
    date: filterDate || undefined,
    priority: filterPriority !== 'all' ? filterPriority : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const tasks: HistoryTask[] = tasksResponse?.data || [];
  const hasActiveFilters = filterDate !== '' || filterPriority !== 'all' || filterStatus !== 'all';

  const handleOpenFilters = useCallback(() => {
    setTempDate(filterDate);
    setTempPriority(filterPriority);
    setTempStatus(filterStatus);
    setIsFilterOpen(true);
  }, [filterDate, filterPriority, filterStatus]);

  const handleCloseFilters = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilterDate(tempDate);
    setFilterPriority(tempPriority);
    setFilterStatus(tempStatus);
    setIsFilterOpen(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // Dynamic haptic tick on filter apply
    }
  }, [tempDate, tempPriority, tempStatus]);

  const handleResetFilters = useCallback(() => {
    setTempDate('');
    setTempPriority('all');
    setTempStatus('all');
    setFilterDate('');
    setFilterPriority('all');
    setFilterStatus('all');
    setIsFilterOpen(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Standard micro-vibration on clear action
    }
  }, []);

  // React Virtualizer setup for scrolling performance
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 148, // Estimated pixel height of each item card
    overscan: 6,
  });

  return {
    t,
    tasks,
    isLoading,
    refetch,
    hasActiveFilters,
    isFilterOpen,
    tempDate,
    tempPriority,
    tempStatus,
    filterDate,
    filterPriority,
    filterStatus,
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
  };
};
