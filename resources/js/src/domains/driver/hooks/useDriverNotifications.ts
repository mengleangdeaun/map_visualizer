import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverNotificationService, DbNotification } from '../services/driverNotificationService';
import { pwaToast as toast } from '../store/usePwaToastStore';

export const useDriverNotifications = (params: any = {}) => {
    return useQuery({
        queryKey: ['driver', 'notifications', params],
        queryFn: () => driverNotificationService.getNotifications(params),
        refetchInterval: 30000, // Sync every 30s
    });
};

export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => driverNotificationService.markAsRead(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });

            // Snapshot previous state
            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            // Optimistically mark as read in cache
            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.map((notification: DbNotification) => 
                        notification.id === id 
                            ? { ...notification, read_at: new Date().toISOString() } 
                            : notification
                    )
                };
            });

            return { previousNotifications };
        },
        onError: (err, id, context: any) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['driver', 'notifications'], context.previousNotifications);
            }
            toast.error('Failed to mark notification as read');
        },
        onSuccess: () => {
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'notifications'] });
        }
    });
};

export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => driverNotificationService.markAllAsRead(),
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });

            // Snapshot previous state
            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            // Optimistically mark all as read in cache
            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.map((notification: DbNotification) => ({
                        ...notification,
                        read_at: new Date().toISOString()
                    }))
                };
            });

            return { previousNotifications };
        },
        onError: (err, variables, context: any) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['driver', 'notifications'], context.previousNotifications);
            }
            toast.error('Failed to mark all notifications as read');
        },
        onSuccess: () => {
            toast.success('All notifications marked as read');
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50]);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'notifications'] });
        }
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => driverNotificationService.deleteNotification(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });
            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            // Optimistically remove from cache
            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.filter((notification: DbNotification) => notification.id !== id)
                };
            });

            return { previousNotifications };
        },
        onError: (err, id, context: any) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['driver', 'notifications'], context.previousNotifications);
            }
            toast.error('Failed to delete notification');
        },
        onSuccess: () => {
            toast.success('Notification deleted');
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'notifications'] });
        }
    });
};

export const useDeleteAllNotifications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => driverNotificationService.deleteAllNotifications(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });
            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            // Optimistically empty the cache list
            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: []
                };
            });

            return { previousNotifications };
        },
        onError: (err, variables, context: any) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['driver', 'notifications'], context.previousNotifications);
            }
            toast.error('Failed to delete all notifications');
        },
        onSuccess: () => {
            toast.success('All notifications deleted');
            if ('vibrate' in navigator) {
                navigator.vibrate([30, 30]);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'notifications'] });
        }
    });
};
