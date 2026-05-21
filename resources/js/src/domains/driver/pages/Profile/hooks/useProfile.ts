import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useActiveShift, useCheckOutVehicle } from '@/domains/driver/hooks/useDriverShift';
import { useHeaderStore } from '@/domains/driver/store/useHeaderStore';
import { pwaToast as toast } from '@/domains/driver/store/usePwaToastStore';
import { Settings } from 'lucide-react';

export const useProfile = () => {
  const { t, i18n } = useTranslation(['driver', 'system']);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const setHeader = useHeaderStore((s) => s.setHeader);

  // Fetch active shift and checked-in vehicle
  const { data: activeShiftData, isLoading: isActiveShiftLoading, refetch } = useActiveShift();
  const checkOutMutation = useCheckOutVehicle();

  const activeVehicle = activeShiftData?.vehicle || null;
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  // Page Header synchronization
  useEffect(() => {
    setHeader({
      title: t('driver:my_profile') || 'My Profile',
      showBackButton: true,
      backTarget: '/driver',
      rightAction: React.createElement(
        'button',
        {
          onClick: () => navigate({ to: '/driver/settings' }),
          className: 'p-2 text-muted-foreground hover:text-primary transition-colors shrink-0',
          'aria-label': 'Settings',
        },
        React.createElement(Settings, { size: 20 })
      ),
    });
    return () => setHeader({});
  }, [setHeader, t, navigate]);

  const handleSignOut = useCallback(() => {
    setIsSignOutOpen(true);
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Light haptic feedback
    }
  }, []);

  const handleConfirmSignOut = useCallback(() => {
    setIsSignOutOpen(false);
    clearAuth();
    toast.success(t('driver:logged_out_success') || 'Signed out successfully');
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Heavy confirmation haptic
    }
    navigate({ to: '/auth/login' });
  }, [clearAuth, navigate, t]);

  const handleCancelSignOut = useCallback(() => {
    setIsSignOutOpen(false);
  }, []);

  const handleCheckOut = useCallback(() => {
    checkOutMutation.mutate();
  }, [checkOutMutation]);

  const changeLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      toast.success(
        t('driver:language_changed') || `Language changed to ${lang.toUpperCase()}`
      );
      if ('vibrate' in navigator) {
        navigator.vibrate(15); // Dynamic haptic tick on setting toggle
      }
    },
    [i18n, t]
  );

  // Calculate initials dynamically
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'DR';

  return {
    user,
    t,
    i18n,
    navigate,
    initials,
    activeVehicle,
    isActiveShiftLoading,
    isCheckOutPending: checkOutMutation.isPending,
    isSignOutOpen,
    refetch,
    handleSignOut,
    handleConfirmSignOut,
    handleCancelSignOut,
    handleCheckOut,
    changeLanguage,
  };
};
