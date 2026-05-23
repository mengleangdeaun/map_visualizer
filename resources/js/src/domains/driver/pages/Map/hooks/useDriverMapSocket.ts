import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '@/lib/echo';
import { pwaToast as toast } from '../../../store/usePwaToastStore';

interface UseDriverMapSocketProps {
    userId: string | null | undefined;
    companyId: string | null | undefined;
}

export const useDriverMapSocket = ({ userId, companyId }: UseDriverMapSocketProps) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const driverChannel = echo.private(`driver.${userId}`);

        driverChannel.listen('.route.assigned', (event: any) => {
            // Refetch the active route query so the map updates immediately
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });

            const stopCount = event?.route?.stop_count ?? 0;
            const distance = event?.route?.estimated_distance_km
                ? ` · ${event.route.estimated_distance_km} km`
                : '';

            toast.success(`📦 New route assigned — ${stopCount} stops${distance}`);

            if ('vibrate' in navigator) {
                navigator.vibrate([150, 80, 150]);
            }
        });

        return () => {
            driverChannel.stopListening('.route.assigned');
        };
    }, [userId, queryClient]);

    useEffect(() => {
        if (!companyId) return;

        const companyChannelName = `company.${companyId}`;
        const companyChannel = echo.private(companyChannelName);

        companyChannel
            .listen('.road-alert.created', (e: any) => {
                toast.warning(`Road Alert: ${e.alertData.description}`, {
                    description: "Dispatched by Command Center"
                });

                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                }

                queryClient.invalidateQueries({ queryKey: ['driver', 'road-alerts'] });
            })
            .listen('.road-alert.deleted', (_e: any) => {
                toast.info(`Road roadblock resolved and cleared.`);
                queryClient.invalidateQueries({ queryKey: ['driver', 'road-alerts'] });
            });

        return () => {
            echo.leave(companyChannelName);
        };
    }, [companyId, queryClient]);
};

export default useDriverMapSocket;
