import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import {
  useUpdateProfilePicture,
  useRequestEmailChange,
  useConfirmEmailChange,
  useChangePassword,
  useSavePushSubscription,
  useDeletePushSubscription,
} from '@/domains/driver/hooks/useDriverSettings';

export const useSettings = () => {
  const { t } = useTranslation(['driver', 'system']);
  const { user } = useAuthStore();
  const setHeader = useHeaderStore((s) => s.setHeader);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email form state
  const [emailVal, setEmailVal] = useState(user?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(() => {
    const localPref = localStorage.getItem('mapcn_push_enabled');
    if (localPref !== null) return localPref === 'true';
    return 'Notification' in window && Notification.permission === 'granted';
  });

  // Mutations
  const updatePictureMutation = useUpdateProfilePicture();
  const requestEmailMutation = useRequestEmailChange();
  const confirmEmailMutation = useConfirmEmailChange();
  const changePasswordMutation = useChangePassword();
  const savePushMutation = useSavePushSubscription();
  const deletePushMutation = useDeletePushSubscription();

  useEffect(() => {
    setHeader({
      title: t('driver:settings') || 'Settings',
      showBackButton: true,
      backTarget: '/driver/profile',
    });
    return () => setHeader({});
  }, [setHeader, t]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) updatePictureMutation.mutate(file);
    },
    [updatePictureMutation]
  );

  const handleRequestEmailChange = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!emailVal || emailVal === user?.email) return;
      requestEmailMutation.mutate(emailVal, {
        onSuccess: (data: any) => {
          setIsEmailVerificationSent(true);
          setSimulatedCode(data.code);
        },
      });
    },
    [emailVal, user?.email, requestEmailMutation]
  );

  const handleConfirmEmailChange = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!verificationCode) return;
      confirmEmailMutation.mutate(verificationCode, {
        onSuccess: () => {
          setIsEmailVerificationSent(false);
          setVerificationCode('');
          setSimulatedCode('');
        },
      });
    },
    [verificationCode, confirmEmailMutation]
  );

  const handlePasswordChange = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPassword || !newPassword) return;
      changePasswordMutation.mutate(
        { currentPass: currentPassword, newPass: newPassword },
        {
          onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
          },
        }
      );
    },
    [currentPassword, newPassword, changePasswordMutation]
  );

  const handlePushToggle = useCallback(
    async (checked: boolean) => {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      if (checked) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushEnabled(true);
          localStorage.setItem('mapcn_push_enabled', 'true');
          savePushMutation.mutate({
            endpoint: 'https://updates.mapcn.com/push/sub/' + user?.id,
            public_key: 'BIP69342784523789456237894562789456278945627894562378945627894562789',
            auth_token: 'A1B2C3D4E5F6G7H8I9J0',
            device_type: 'desktop',
          });
        } else {
          setPushEnabled(false);
          localStorage.setItem('mapcn_push_enabled', 'false');
        }
      } else {
        setPushEnabled(false);
        localStorage.setItem('mapcn_push_enabled', 'false');
        deletePushMutation.mutate('https://updates.mapcn.com/push/sub/' + user?.id);
      }
    },
    [user?.id, savePushMutation, deletePushMutation]
  );

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if ('vibrate' in navigator) navigator.vibrate(15);
  }, []);

  return {
    t,
    user,
    initials,
    fileInputRef,
    // email
    emailVal,
    setEmailVal,
    verificationCode,
    setVerificationCode,
    isEmailVerificationSent,
    setIsEmailVerificationSent,
    simulatedCode,
    // password
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    // push
    pushEnabled,
    // mutations
    updatePictureMutation,
    requestEmailMutation,
    confirmEmailMutation,
    changePasswordMutation,
    savePushMutation,
    deletePushMutation,
    // handlers
    handleAvatarClick,
    handleFileChange,
    handleRequestEmailChange,
    handleConfirmEmailChange,
    handlePasswordChange,
    handlePushToggle,
    handleRefresh,
  };
};
