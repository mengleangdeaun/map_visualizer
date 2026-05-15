import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, Task } from '@/domains/admin/tasks/services/taskService';
import { toast } from 'sonner';

export const useTasks = (params: any = {}) => {
    return useQuery({
        queryKey: ['tasks', params],
        queryFn: () => taskService.list(params),
    });
};

export const useTask = (id: string | null) => {
    return useQuery({
        queryKey: ['task', id],
        queryFn: () => (id ? taskService.get(id) : null),
        enabled: !!id,
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Task>) => taskService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create task');
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => 
            taskService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', data.id] });
            toast.success('Task updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update task');
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => taskService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete task');
        },
    });
};
