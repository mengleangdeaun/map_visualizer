import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '../../../services/userService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useUsers = (params: any) => {
    return useQuery({
        queryKey: ['admin-users', params],
        queryFn: () => userService.getUsers(params),
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system'); // Reusing translation keys from system for user creation messages

    return useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success(t('user_created_successfully', 'User created successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_user', 'Error creating user'));
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
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success(t('user_updated_successfully', 'User updated successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_updating_user', 'Error updating user'));
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('system');

    return useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success(t('user_deleted_successfully', 'User deleted successfully'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_deleting_user', 'Error deleting user'));
        }
    });
};
