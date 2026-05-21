import React, { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { useProfile } from './hooks/useProfile';
import { ProfileCard } from './components/ProfileCard';
import { CompanyCard } from './components/CompanyCard';
import { ActiveVehicleCard } from './components/ActiveVehicleCard';
import { NavigationLinks } from './components/NavigationLinks';
import { PreferencesCard } from './components/PreferencesCard';
import { SignOutSheet } from './components/SignOutSheet';

const DriverProfile = React.memo(() => {
  const {
    user,
    t,
    i18n,
    navigate,
    initials,
    activeVehicle,
    isActiveShiftLoading,
    isCheckOutPending,
    isSignOutOpen,
    refetch,
    handleSignOut,
    handleConfirmSignOut,
    handleCancelSignOut,
    handleCheckOut,
    changeLanguage,
  } = useProfile();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleNavigate = useCallback(
    (target: string) => {
      navigate({ to: target });
    },
    [navigate]
  );

  const roleLabel =
    user?.role === 'driver' ? t('driver:role_driver') || 'DRIVER' : user?.role?.toUpperCase() || 'DRIVER';

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50/80 px-4 py-6 flex flex-col gap-5 max-w-md mx-auto pb-24">
        {/* Profile Card */}
        <ProfileCard user={user} initials={initials} roleLabel={roleLabel} />

        {/* Company Card */}
        {user?.company && <CompanyCard company={user.company} label={t('driver:company')} />}

        {/* Active Vehicle Card */}
        <ActiveVehicleCard
          activeVehicle={activeVehicle}
          isActiveShiftLoading={isActiveShiftLoading}
          isCheckOutPending={isCheckOutPending}
          onCheckOut={handleCheckOut}
          t={t}
        />

        {/* Task & Delivery History Links */}
        <NavigationLinks onNavigate={handleNavigate} t={t} />

        {/* Preferences Language & Telemetry */}
        <PreferencesCard
          currentLanguage={i18n.language}
          activeVehicle={activeVehicle}
          onChangeLanguage={changeLanguage}
          t={t}
        />

        {/* Sign Out Trigger Button */}
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wide text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2"
        >
          <LogOut size={16} strokeWidth={2.5} />
          {t('driver:sign_out') || 'Sign Out'}
        </button>

        {/* Sign Out Confirmation Sheet Overlay */}
        <SignOutSheet
          isOpen={isSignOutOpen}
          onClose={handleCancelSignOut}
          onConfirm={handleConfirmSignOut}
          t={t}
        />
      </div>
    </PullToRefresh>
  );
});

DriverProfile.displayName = 'DriverProfile';

export default DriverProfile;