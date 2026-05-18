import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverTaskService } from '../services/driverTaskService';
import { pwaToast as toast } from '../store/usePwaToastStore';

export const useDriverTasks = (params: any = {}) => {
    return useQuery({
        queryKey: ['driver', 'tasks', params],
        queryFn: () => driverTaskService.getTasks(params),
        refetchInterval: 30000, // Refresh every 30s for drivers
    });
};

export const useUpdateTaskStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, status, data }: { taskId: string; status: string; data?: any }) => 
            driverTaskService.updateStatus(taskId, status, data),
        onMutate: async ({ taskId, status }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['driver', 'tasks'] });

            // Snapshot the previous value
            const previousTasks = queryClient.getQueryData(['driver', 'tasks']);

            // Optimistically update to the new value
            queryClient.setQueriesData({ queryKey: ['driver', 'tasks'] }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.map((task: any) => 
                        task.id === taskId ? { ...task, status } : task
                    )
                };
            });

            // Return context with rollback snapshot
            return { previousTasks };
        },
        onError: (error: any, variables, context: any) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['driver', 'tasks'], context.previousTasks);
            }
            toast.error(error.response?.data?.message || 'Failed to update task status');
        },
        onSuccess: (updatedTask) => {
            toast.success(`Task status updated to ${updatedTask.status}`);
            
            // Haptic feedback for mobile devices
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        },
        onSettled: () => {
            // Always sync back with server state
            queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
        }
    });
};
