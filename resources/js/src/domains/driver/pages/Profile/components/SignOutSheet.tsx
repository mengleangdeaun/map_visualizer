import React from 'react';
import { LogOut } from 'lucide-react';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';

interface SignOutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}

export const SignOutSheet = React.memo(({ isOpen, onClose, onConfirm, t }: SignOutSheetProps) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* 
        Optimization: Only mount inner DOM nodes if the bottom sheet is active.
        This speeds up initial load time significantly and avoids redundant node rendering.
      */}
      {isOpen ? (
        <div className="flex flex-col items-center gap-5 p-4 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <LogOut size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {t('driver:confirm_sign_out_title') || 'Are you sure you want to sign out?'}
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 max-w-xs leading-normal">
              {t('driver:confirm_sign_out_description') ||
                'This will end your shift tracking and stop automatic GPS telemetry updates.'}
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 mt-2">
            <button
              onClick={onConfirm}
              className="w-full py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-transform duration-150"
            >
              {t('driver:confirm_sign_out') || 'Sign Out'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 active:scale-[0.98] transition-transform duration-150"
            >
              {t('driver:cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      ) : null}
    </BottomSheet>
  );
});

SignOutSheet.displayName = 'SignOutSheet';
