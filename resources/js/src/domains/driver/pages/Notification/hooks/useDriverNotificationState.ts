import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverNotificationService } from '../services/driverNotificationService';
import { pwaToast as toast } from '../../../store/usePwaToastStore';
import { DbNotification } from '../types';

export const useDriverNotificationState = (params: any = {}) => {
    const queryClient = useQueryClient();
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // 1. Fetch paginated notifications
    const { data: notificationsData, isLoading, refetch } = useQuery({
        queryKey: ['driver', 'notifications', params],
        queryFn: () => driverNotificationService.getNotifications(params),
        refetchInterval: 30000, // Background sync every 30s
    });

    const notifications = notificationsData?.data || [];

    // 2. Mark specific notification as read with optimistic updates
    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => driverNotificationService.markAsRead(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });

            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((notification: DbNotification) =>
                        notification.id === id
                            ? { ...notification, read_at: new Date().toISOString() }
                            : notification
                    ),
                };
            });

            return { previousNotifications };
        },
        onError: (_err, _id, context: any) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['driver', 'notifications'], context.previousNotifications);
            }
            toast.error('Failed to mark notification as read');
        },
        onSuccess: () => {
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'notifications'] });
        },
    });

    // 3. Mark all notifications as read
    const markAllAsReadMutation = useMutation({
        mutationFn: () => driverNotificationService.markAllAsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });

            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((notification: DbNotification) => ({
                        ...notification,
                        read_at: new Date().toISOString(),
                    })),
                };
            });

            return { previousNotifications };
        },
        onError: (_err, _variables, context: any) => {
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
        },
    });

    // 4. Delete single notification
    const deleteMutation = useMutation({
        mutationFn: (id: string) => driverNotificationService.deleteNotification(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });

            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.filter((notification: DbNotification) => notification.id !== id),
                };
            });

            return { previousNotifications };
        },
        onError: (_err, _id, context: any) => {
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
        },
    });

    // 5. Delete all notifications
    const deleteAllMutation = useMutation({
        mutationFn: () => driverNotificationService.deleteAllNotifications(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['driver', 'notifications'] });

            const previousNotifications = queryClient.getQueryData(['driver', 'notifications']);

            queryClient.setQueriesData({ queryKey: ['driver', 'notifications'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: [],
                };
            });

            return { previousNotifications };
        },
        onError: (_err, _variables, context: any) => {
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
        },
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const handleMarkAllRead = () => {
        if (unreadCount > 0) {
            markAllAsReadMutation.mutate();
        }
    };

    const handleDeleteAllConfirm = () => {
        deleteAllMutation.mutate(undefined, {
            onSuccess: () => {
                setIsConfirmDeleteOpen(false);
            },
        });
    };

    return {
        notifications,
        isLoading,
        unreadCount,
        refetch,
        isConfirmDeleteOpen,
        setIsConfirmDeleteOpen,
        markAsReadMutation,
        markAllAsReadMutation,
        deleteMutation,
        deleteAllMutation,
        handleMarkAllRead,
        handleDeleteAllConfirm,
    };
};

export default useDriverNotificationState;
