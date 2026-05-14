import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService, Location } from '../../../../fleet/services/locationService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useLocations = (params: any) => {
    return useQuery({
        queryKey: ['locations', params],
        queryFn: () => locationService.getLocations(params),
    });
};

export const useCreateLocation = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: locationService.createLocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success(t('location_created_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_location'));
        }
    });
};

export const useUpdateLocation = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Location> }) => 
            locationService.updateLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success(t('location_updated_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_location'));
        }
    });
};

export const useDeleteLocation = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: locationService.deleteLocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success(t('location_deleted_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_location'));
        }
    });
};
