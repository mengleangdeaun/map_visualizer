import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackingService } from '../services/trackingService';
import { deliveryService } from '../../../services/deliveryService';
import { taskService } from '../../Tasks/services/taskService';
import { toast } from 'sonner';

export const useTracking = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [searchType, setSearchType] = useState<'all' | 'delivery' | 'task'>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('admin_recent_tracking');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Save recent search helper
    const saveToRecent = (num: string) => {
        if (!num) return;
        const cleaned = num.trim();
        const updated = [cleaned, ...recentSearches.filter((s) => s !== cleaned)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('admin_recent_tracking', JSON.stringify(updated));
    };

    // Auto-prefix detection helper
    useEffect(() => {
        const queryUpper = searchQuery.toUpperCase();
        if (queryUpper.startsWith('TRK-') || queryUpper.startsWith('ORD-')) {
            setSearchType('delivery');
        } else if (queryUpper.startsWith('TSK-')) {
            setSearchType('task');
        }
    }, [searchQuery]);

    // Fetch lists for quick tracking overview
    const { data: recentDeliveries, isLoading: loadingRecDeliveries } = useQuery({
        queryKey: ['recent-deliveries-list'],
        queryFn: () => deliveryService.getDeliveries({ per_page: 5 }),
    });

    const { data: recentTasks, isLoading: loadingRecTasks } = useQuery({
        queryKey: ['recent-tasks-list'],
        queryFn: () => taskService.list({ per_page: 5 }),
    });

    // Unified Track Query
    const {
        data: trackingResult,
        isLoading: isSearching,
        error: trackingError,
    } = useQuery({
        queryKey: ['track-unified', activeQuery, searchType],
        queryFn: () => trackingService.track(activeQuery, searchType),
        enabled: !!activeQuery,
        staleTime: 5000,
        refetchOnWindowFocus: false,
    });

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) {
            toast.error('Please enter a valid tracking number');
            return;
        }
        setActiveQuery(searchQuery.trim());
        saveToRecent(searchQuery.trim());
    };

    const handleQuickTrack = (num: string, type: 'delivery' | 'task') => {
        setSearchQuery(num);
        setSearchType(type);
        setActiveQuery(num);
        saveToRecent(num);
    };

    const handleClear = () => {
        setSearchQuery('');
        setActiveQuery('');
    };

    const hasSearched = !!activeQuery;
    const hasNoResults = hasSearched && !isSearching && !trackingResult;

    return {
        searchQuery,
        setSearchQuery,
        activeQuery,
        setActiveQuery,
        searchType,
        setSearchType,
        recentSearches,
        recentDeliveries,
        loadingRecDeliveries,
        recentTasks,
        loadingRecTasks,
        trackingResult,
        isSearching,
        hasSearched,
        hasNoResults,
        handleSearch,
        handleQuickTrack,
        handleClear,
    };
};
