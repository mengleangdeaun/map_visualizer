import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '../../../services/userService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useUsers = (params: any) => {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => userService.getUsers(params),
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('user_created_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_user'));
        }
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormData | Partial<User> }) => 
            userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('user_updated_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_user'));
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('user_deleted_successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_user'));
        }
    });
};
