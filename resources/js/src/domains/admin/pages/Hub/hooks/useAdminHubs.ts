import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService, Location } from '@/domains/fleet/services/locationService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';

export const useAdminHubs = (params: any) => {
    const { user } = useAuthStore();
    
    return useQuery({
        queryKey: ['admin-hubs', { ...params, company_id: user?.company_id }],
        queryFn: () => locationService.getLocations({ 
            ...params, 
            company_id: user?.company_id 
        }),
        enabled: !!user?.company_id,
    });
};

export const useCreateAdminHub = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('admin');
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: (data: Partial<Location>) => 
            locationService.createLocation({ ...data, company_id: user?.company_id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hubs'] });
            toast.success(t('location_created_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_location'));
        }
    });
};

export const useUpdateAdminHub = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('admin');

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Location> }) => 
            locationService.updateLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hubs'] });
            toast.success(t('location_updated_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_location'));
        }
    });
};

export const useDeleteAdminHub = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('admin');

    return useMutation({
        mutationFn: locationService.deleteLocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hubs'] });
            toast.success(t('location_deleted_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_location'));
        }
    });
};
