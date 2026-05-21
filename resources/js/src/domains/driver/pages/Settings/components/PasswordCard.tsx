import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PasswordCardProps {
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  t: (key: string) => string;
}

export const PasswordCard = React.memo(
  ({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    onSubmit,
    isPending,
    t,
  }: PasswordCardProps) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3.5">
          <div className="size-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
            <Lock size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider leading-none mb-0.5">
              {t('driver:security') || 'Security'}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-tight">
              {t('driver:reset_password') || 'Change Password'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current-pass" className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
              {t('driver:current_password') || 'Current Password'}
            </label>
            <input
              id="current-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 rounded-2xl bg-gray-50 border-0 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-pass" className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
              {t('driver:new_password') || 'New Password'}
            </label>
            <input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('driver:min_8_chars') || 'Minimum 8 characters'}
              className="w-full h-12 rounded-2xl bg-gray-50 border-0 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-[10px] font-semibold text-rose-500 px-1">
                {t('driver:password_too_short') || 'Password must be at least 8 characters'}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!currentPassword || newPassword.length < 8 || isPending}
            className="w-full rounded-2xl h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98] transition-all mt-1"
          >
            {isPending
              ? t('driver:updating_password') || 'Updating...'
              : t('driver:update_password') || 'Update Password'}
          </Button>
        </form>
      </div>
    );
  }
);

PasswordCard.displayName = 'PasswordCard';
