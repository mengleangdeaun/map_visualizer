import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, Company } from '../../../services/companyService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useCompanies = (page = 1, perPage = 10, search?: string) => {
    return useQuery({
        queryKey: ['companies', page, perPage, search],
        queryFn: () => companyService.getCompanies(page, perPage, search),
    });
};

export const useCreateCompany = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: companyService.createCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('company_created_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_company'));
        }
    });
};

export const useUpdateCompany = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormData | Partial<Company> }) => 
            companyService.updateCompany(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('company_updated_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_company'));
        }
    });
};

export const useDeleteCompany = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: companyService.deleteCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('company_deleted_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_company'));
        }
    });
};
