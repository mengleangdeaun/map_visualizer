import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { taskService } from '../services/taskService';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import { pwaToast as toast } from '@/domains/driver/store/usePwaToastStore';
import { echo } from '@/lib/echo';
import { ActiveTask } from '../types';

export const useTasks = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const setHeader = useHeaderStore((s) => s.setHeader);

    // Set mobile header configuration
    useEffect(() => {
        setHeader({
            title: t('driver:tasks') || 'My Tasks',
            showBackButton: true,
            backTarget: '/driver'
        });
        return () => setHeader({});
    }, [setHeader, t]);

    // Active tasks query (refetches every 30s)
    const { data: tasksResponse, isLoading, refetch } = useQuery({
        queryKey: ['driver', 'tasks', 'active'],
        queryFn: () => taskService.getActiveTasks(),
        refetchInterval: 30000,
    });

    const tasks: ActiveTask[] = tasksResponse?.data || [];

    // Real-time listener for task updates
    useEffect(() => {
        if (!user?.id) return;

        const channelName = `App.Models.User.${user.id}`;
        
        echo.private(channelName)
            .listen('.task.updated', () => {
                queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            });

        return () => {
            echo.leave(channelName);
        };
    }, [user?.id, queryClient]);

    // Mutation to update task status
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
            taskService.updateStatus(taskId, status),
        onMutate: async ({ taskId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'tasks'] });

            const previousQueries = queryClient.getQueriesData({ queryKey: ['driver', 'tasks'] });

            queryClient.setQueriesData({ queryKey: ['driver', 'tasks'] }, (old: any) => {
                if (!old) return old;

                if (typeof old === 'object' && 'data' in old && Array.isArray(old.data)) {
                    return {
                        ...old,
                        data: old.data.map((task: any) => 
                            task.id === taskId ? { ...task, status } : task
                        )
                    };
                }

                if (Array.isArray(old)) {
                    return old.map((task: any) => 
                        task.id === taskId ? { ...task, status } : task
                    );
                }

                return old;
            });

            return { previousQueries };
        },
        onError: (error: any, variables, context: any) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, oldData]: any) => {
                    queryClient.setQueryData(queryKey, oldData);
                });
            }
            toast.error(error.response?.data?.message || 'Failed to update task status');
        },
        onSuccess: (updatedTask) => {
            toast.success(`Task status updated to ${updatedTask.status}`);
            
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
        }
    });

    const handleStatusChange = useCallback((taskId: string, currentStatus: string) => {
        let nextStatus = '';
        if (currentStatus === 'assigned' || currentStatus === 'pending') {
            nextStatus = 'in_progress';
        } else if (currentStatus === 'in_progress') {
            nextStatus = 'completed';
        }

        if (nextStatus) {
            updateStatusMutation.mutate({ taskId, status: nextStatus });
        }
    }, [updateStatusMutation]);

    return {
        t,
        tasks,
        isLoading,
        refetch,
        handleStatusChange,
        isUpdating: updateStatusMutation.isPending,
        updatingTaskId: updateStatusMutation.variables?.taskId,
    };
};
