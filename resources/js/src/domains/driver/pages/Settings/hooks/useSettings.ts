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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useSettings = () => {
  const { t } = useTranslation();
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
      title: t('settings') || 'Settings',
      showBackButton: true,
      backTarget: '/driver/profile',
    });
    return () => setHeader({});
  }, [setHeader, t]);

  // Dynamically synchronize push notification toggle state with real browser subscription on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      setPushEnabled(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<ServiceWorkerRegistration>((_, reject) => 
            setTimeout(() => reject(new Error('Service worker ready timeout')), 2000)
          )
        ]);
        const subscription = await registration.pushManager.getSubscription();
        const hasActiveSub = !!subscription;
        setPushEnabled(hasActiveSub);
        localStorage.setItem('mapcn_push_enabled', hasActiveSub ? 'true' : 'false');
      } catch (e) {
        console.warn('Could not retrieve active push subscription (likely in dev mode or SW not active):', e);
        const localPref = localStorage.getItem('mapcn_push_enabled');
        setPushEnabled(localPref === 'true');
      }
    };

    checkSubscription();
  }, []);

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
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            setPushEnabled(false);
            localStorage.setItem('mapcn_push_enabled', 'false');
            return;
          }

          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration>((_, reject) => 
              setTimeout(() => reject(new Error('Service worker ready timeout')), 2000)
            )
          ]);
          
          const vapidPublicKey = 'BI1hvKDfDcfpjyJEYyDcsHhyb10ZeyynBSxpg-y26l0lHLJKjfz6mNbyt4uA5-OcArH2NA9Mx01g_u75Af6r6ck';
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey as any,
          });

          const subscriptionJson = subscription.toJSON();
          const p256dh = subscriptionJson.keys?.p256dh || '';
          const auth = subscriptionJson.keys?.auth || '';

          setPushEnabled(true);
          localStorage.setItem('mapcn_push_enabled', 'true');

          const userAgent = navigator.userAgent.toLowerCase();
          let resolvedDevice: 'android' | 'ios' | 'desktop' = 'desktop';
          if (/android/i.test(userAgent)) {
            resolvedDevice = 'android';
          } else if (/iphone|ipad|ipod/i.test(userAgent)) {
            resolvedDevice = 'ios';
          }

          savePushMutation.mutate({
            endpoint: subscription.endpoint,
            public_key: p256dh,
            auth_token: auth,
            device_type: resolvedDevice,
          });
        } catch (e) {
          console.warn('Service Worker not ready/active (expected in local dev mode). Falling back to mock subscription for local testing.', e);
          setPushEnabled(true);
          localStorage.setItem('mapcn_push_enabled', 'true');
          
          // Fallback to local dev mock registration so that dispatches and UI testing still works in dev mode!
          savePushMutation.mutate({
            endpoint: 'https://updates.mapcn.com/push/sub/mock-' + user?.id,
            public_key: 'BIP69342784523789456237894562789456278945627894562378945627894562789',
            auth_token: 'A1B2C3D4E5F6G7H8I9J0',
            device_type: 'desktop',
          });
        }
      } else {
        try {
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration>((_, reject) => 
              setTimeout(() => reject(new Error('Service worker ready timeout')), 2000)
            )
          ]);
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            deletePushMutation.mutate(subscription.endpoint);
          } else {
            // Delete fallback mock subscription
            deletePushMutation.mutate('https://updates.mapcn.com/push/sub/mock-' + user?.id);
          }
        } catch (e) {
          console.warn('Service Worker not ready/active (expected in local dev mode). Falling back to mock cleanup.', e);
          deletePushMutation.mutate('https://updates.mapcn.com/push/sub/mock-' + user?.id);
        }
        setPushEnabled(false);
        localStorage.setItem('mapcn_push_enabled', 'false');
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
