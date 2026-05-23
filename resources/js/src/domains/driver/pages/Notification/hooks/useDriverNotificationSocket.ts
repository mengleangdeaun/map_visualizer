import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '@/lib/echo';
import { pwaToast as toast } from '../../../store/usePwaToastStore';

interface UseDriverNotificationSocketProps {
    userId: string | null | undefined;
}

export const useDriverNotificationSocket = ({ userId }: UseDriverNotificationSocketProps) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const userChannelName = `App.Models.User.${userId}`;
        const userChannel = echo.private(userChannelName);

        userChannel.notification((notification: any) => {
            // 1. Trigger mobile haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([150, 50, 150]);
            }

            // 2. Display premium in-app toast notification instantly
            toast.info(notification.title || 'Operational Update', {
                description: notification.description || 'An administrative action has been recorded.',
            });

            // 3. Invalidate active notifications query immediately to increment the unread badge
            queryClient.invalidateQueries({ queryKey: ['driver', 'notifications'] });

            // 4. Smart Domain Invalidation Engine
            const action = notification.action || '';
            
            if (action.includes('task')) {
                // Invalidate driver tasks list
                queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            }
            
            if (action.includes('delivery') || action.includes('route')) {
                // Invalidate active delivery route stops and markers
                queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
            }
            
            if (action.includes('roadblock')) {
                // Invalidate roadblocks warning list
                queryClient.invalidateQueries({ queryKey: ['driver', 'road-alerts'] });
            }
        });

        return () => {
            echo.leave(userChannelName);
        };
    }, [userId, queryClient]);
};

export default useDriverNotificationSocket;
