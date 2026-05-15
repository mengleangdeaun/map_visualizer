import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverTaskService } from '../services/driverTaskService';
import { toast } from 'sonner';

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
        onSuccess: (updatedTask) => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            toast.success(`Task status updated to ${updatedTask.status}`);
            
            // Haptic feedback for mobile devices
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update task status');
        }
    });
};
