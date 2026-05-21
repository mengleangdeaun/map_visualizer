import React from 'react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { useSettings } from './hooks/useSettings';
import { AvatarCard } from './components/AvatarCard';
import { EmailCard } from './components/EmailCard';
import { PasswordCard } from './components/PasswordCard';
import { NotificationsCard } from './components/NotificationsCard';

const DriverSettings = React.memo(() => {
  const {
    t,
    user,
    initials,
    fileInputRef,
    emailVal,
    setEmailVal,
    verificationCode,
    setVerificationCode,
    isEmailVerificationSent,
    setIsEmailVerificationSent,
    simulatedCode,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    pushEnabled,
    updatePictureMutation,
    requestEmailMutation,
    confirmEmailMutation,
    changePasswordMutation,
    savePushMutation,
    deletePushMutation,
    handleAvatarClick,
    handleFileChange,
    handleRequestEmailChange,
    handleConfirmEmailChange,
    handlePasswordChange,
    handlePushToggle,
    handleRefresh,
  } = useSettings();

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50/80 px-4 py-6 flex flex-col gap-5 max-w-md mx-auto pb-24 animate-in fade-in duration-500">

        {/* Avatar Editor */}
        <AvatarCard
          user={user}
          initials={initials}
          isPending={updatePictureMutation.isPending}
          onAvatarClick={handleAvatarClick}
          onFileChange={handleFileChange}
          fileInputRef={fileInputRef}
          t={t}
        />

        {/* Email Change */}
        <EmailCard
          currentEmail={user?.email}
          emailVal={emailVal}
          setEmailVal={setEmailVal}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          isEmailVerificationSent={isEmailVerificationSent}
          setIsEmailVerificationSent={setIsEmailVerificationSent}
          simulatedCode={simulatedCode}
          onRequestChange={handleRequestEmailChange}
          onConfirmChange={handleConfirmEmailChange}
          isRequestPending={requestEmailMutation.isPending}
          isConfirmPending={confirmEmailMutation.isPending}
          t={t}
        />

        {/* Password Change */}
        <PasswordCard
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          onSubmit={handlePasswordChange}
          isPending={changePasswordMutation.isPending}
          t={t}
        />

        {/* Push Notifications */}
        <NotificationsCard
          pushEnabled={pushEnabled}
          isSavePending={savePushMutation.isPending}
          isDeletePending={deletePushMutation.isPending}
          onToggle={handlePushToggle}
          t={t}
        />

      </div>
    </PullToRefresh>
  );
});

DriverSettings.displayName = 'DriverSettings';

export default DriverSettings;
