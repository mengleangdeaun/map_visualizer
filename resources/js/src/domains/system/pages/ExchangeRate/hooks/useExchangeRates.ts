import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateService, ExchangeRate } from '../../../services/exchangeRateService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useExchangeRates = (params: any) => {
    return useQuery({
        queryKey: ['exchange-rates', params],
        queryFn: () => exchangeRateService.getExchangeRates(params),
    });
};

export const useCreateExchangeRate = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: exchangeRateService.createExchangeRate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
            toast.success(t('exchange_rate_created_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_exchange_rate'));
        }
    });
};

export const useUpdateExchangeRate = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ExchangeRate> }) => 
            exchangeRateService.updateExchangeRate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
            toast.success(t('exchange_rate_updated_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_exchange_rate'));
        }
    });
};

export const useDeleteExchangeRate = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: exchangeRateService.deleteExchangeRate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
            toast.success(t('exchange_rate_deleted_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_exchange_rate'));
        }
    });
};
