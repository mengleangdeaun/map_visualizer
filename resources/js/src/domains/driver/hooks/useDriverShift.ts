import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverShiftService } from '../services/driverShiftService';
import { pwaToast as toast } from '../store/usePwaToastStore';
import { useTranslation } from 'react-i18next';

export const useActiveShift = () => {
    return useQuery({
        queryKey: ['driver', 'active-shift'],
        queryFn: () => driverShiftService.getActiveVehicle(),
        staleTime: 1000 * 60 * 5, // 5 minutes stale time
    });
};

export const useCompanyVehicles = () => {
    return useQuery({
        queryKey: ['driver', 'company-vehicles'],
        queryFn: () => driverShiftService.getCompanyVehicles(),
    });
};

export const useCheckInVehicle = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('driver');

    return useMutation({
        mutationFn: (vehicleId: string) => driverShiftService.checkIn(vehicleId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'active-shift'] });
            toast.success(t('successfully_checked_in') || 'Successfully checked in to vehicle');

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || t('failed_check_in') || 'Failed to check in';
            toast.error(errorMsg);
        }
    });
};

export const useCheckOutVehicle = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('driver');

    return useMutation({
        mutationFn: () => driverShiftService.checkOut(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver', 'active-shift'] });
            toast.success(t('successfully_checked_out') || 'Successfully checked out of vehicle');

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(150);
            }
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || t('failed_check_out') || 'Failed to check out';
            toast.error(errorMsg);
        }
    });
};
