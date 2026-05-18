import { useMutation } from '@tanstack/react-query';
import { driverSettingsService, PushSubscriptionPayload } from '../services/driverSettingsService';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { pwaToast as toast } from '../store/usePwaToastStore';
import { useTranslation } from 'react-i18next';

export const useUpdateProfilePicture = () => {
    const { t } = useTranslation('driver');
    const { user, updateUser } = useAuthStore();

    return useMutation({
        mutationFn: (file: File) => driverSettingsService.updateProfilePicture(file),
        onSuccess: (data) => {
            if (user) {
                updateUser({
                    ...user,
                    profile_url: data.profile_url,
                    profile_full_url: data.profile_full_url,
                });
            }
            toast.success(t('profile_picture_updated') || 'Profile picture updated successfully');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || t('profile_picture_failed') || 'Failed to upload profile picture';
            toast.error(msg);
        },
    });
};

export const useRequestEmailChange = () => {
    const { t } = useTranslation('driver');

    return useMutation({
        mutationFn: (email: string) => driverSettingsService.requestEmailChange(email),
        onSuccess: (data) => {
            toast.success(t('verification_code_sent') || 'Verification code sent successfully');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || t('email_request_failed') || 'Failed to request email change';
            toast.error(msg);
        },
    });
};

export const useConfirmEmailChange = () => {
    const { t } = useTranslation('driver');
    const { updateUser } = useAuthStore();

    return useMutation({
        mutationFn: (code: string) => driverSettingsService.confirmEmailChange(code),
        onSuccess: (data) => {
            updateUser(data.user);
            toast.success(t('email_updated_success') || 'Email changed successfully');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || t('email_confirm_failed') || 'Verification code is incorrect or expired';
            toast.error(msg);
        },
    });
};

export const useChangePassword = () => {
    const { t } = useTranslation('driver');

    return useMutation({
        mutationFn: ({ currentPass, newPass }: { currentPass: string; newPass: string }) => 
            driverSettingsService.changePassword(currentPass, newPass),
        onSuccess: () => {
            toast.success(t('password_changed_success') || 'Password updated successfully');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || t('password_change_failed') || 'Failed to change password';
            toast.error(msg);
        },
    });
};

export const useSavePushSubscription = () => {
    const { t } = useTranslation('driver');

    return useMutation({
        mutationFn: (payload: PushSubscriptionPayload) => driverSettingsService.savePushSubscription(payload),
        onSuccess: () => {
            toast.success(t('push_notifications_enabled') || 'Push notifications configured successfully');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Failed to synchronize push subscription';
            console.error(msg);
        },
    });
};

export const useDeletePushSubscription = () => {
    const { t } = useTranslation('driver');

    return useMutation({
        mutationFn: (endpoint: string) => driverSettingsService.deletePushSubscription(endpoint),
        onSuccess: () => {
            toast.success(t('push_notifications_disabled') || 'Push notifications disabled successfully');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Failed to disable push subscription';
            console.error(msg);
        },
    });
};
