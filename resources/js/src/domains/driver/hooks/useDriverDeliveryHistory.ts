import { useQuery } from '@tanstack/react-query';
import { driverDeliveryService } from '../services/driverDeliveryService';

export const useDriverDeliveryHistory = (params: {
    page?: number;
    date?: string;
    status?: string;
} = {}) => {
    return useQuery({
        queryKey: ['driver', 'deliveryHistory', params],
        queryFn: () => driverDeliveryService.getRouteHistory(params),
        placeholderData: (previousData) => previousData, // keep previous page data while fetching next page
        staleTime: 60000, // 1 minute stale time for history records
    });
};
