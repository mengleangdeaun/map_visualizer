import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../../../services/deliveryService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useDeliveries = (params: any) => {
    return useQuery({
        queryKey: ['admin-deliveries', params],
        queryFn: () => deliveryService.getDeliveries(params),
    });
};

export const useCreateDelivery = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation(['system', 'admin']);

    return useMutation({
        mutationFn: deliveryService.createDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
            toast.success(t('delivery_created_successfully', 'Delivery created successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_delivery', 'Error creating delivery'));
        }
    });
};

export const useUpdateDelivery = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation(['system', 'admin']);

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => 
            deliveryService.updateDelivery(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
            toast.success(t('delivery_updated_successfully', 'Delivery updated successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_delivery', 'Error updating delivery'));
        }
    });
};

export const useDeleteDelivery = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation(['system', 'admin']);

    return useMutation({
        mutationFn: deliveryService.deleteDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
            toast.success(t('delivery_deleted_successfully', 'Delivery deleted successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_delivery', 'Error deleting delivery'));
        }
    });
};
