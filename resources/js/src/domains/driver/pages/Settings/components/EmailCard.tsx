import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle } from 'lucide-react';

interface EmailCardProps {
  currentEmail: string | null | undefined;
  emailVal: string;
  setEmailVal: (val: string) => void;
  verificationCode: string;
  setVerificationCode: (val: string) => void;
  isEmailVerificationSent: boolean;
  setIsEmailVerificationSent: (val: boolean) => void;
  simulatedCode: string;
  onRequestChange: (e: React.FormEvent) => void;
  onConfirmChange: (e: React.FormEvent) => void;
  isRequestPending: boolean;
  isConfirmPending: boolean;
  t: (key: string) => string;
}

export const EmailCard = React.memo(
  ({
    currentEmail,
    emailVal,
    setEmailVal,
    verificationCode,
    setVerificationCode,
    isEmailVerificationSent,
    setIsEmailVerificationSent,
    simulatedCode,
    onRequestChange,
    onConfirmChange,
    isRequestPending,
    isConfirmPending,
    t,
  }: EmailCardProps) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3.5">
          <div className="size-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Mail size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider leading-none mb-0.5">
              {t('driver:account') || 'Account'}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-tight">
              {t('driver:change_email') || 'Email Address'}
            </p>
          </div>
        </div>

        {!isEmailVerificationSent ? (
          <form onSubmit={onRequestChange} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-input" className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
                {t('driver:email') || 'Email Address'}
              </label>
              <input
                id="email-input"
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                placeholder="driver@mapcn.com"
                className="w-full h-12 rounded-2xl bg-gray-50 border-0 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={emailVal === currentEmail || isRequestPending}
              className="w-full rounded-2xl h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98] transition-all"
            >
              {isRequestPending
                ? t('driver:sending_code') || 'Sending...'
                : t('driver:request_email_code') || 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirmChange} className="flex flex-col gap-4 animate-in fade-in slide-in-from-top duration-300">
            {simulatedCode && (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl flex items-start gap-2 text-xs font-semibold">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-bold">{t('driver:simulation_code') || 'Demo Code:'} </span>
                  <span className="font-mono font-black bg-amber-100 px-1.5 py-0.5 rounded tracking-widest">
                    {simulatedCode}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code-input" className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
                {t('driver:verification_code') || 'Verification Code'}
              </label>
              <input
                id="code-input"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full h-12 rounded-2xl bg-gray-50 border-0 px-4 text-center text-lg font-black font-mono tracking-[0.4em] text-gray-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEmailVerificationSent(false)}
                className="flex-1 rounded-2xl h-12 text-sm font-bold text-gray-600 border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                {t('driver:back') || 'Back'}
              </Button>
              <Button
                type="submit"
                disabled={verificationCode.length !== 6 || isConfirmPending}
                className="flex-1 rounded-2xl h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98] transition-all"
              >
                {isConfirmPending ? t('driver:verifying') || 'Verifying...' : t('driver:verify') || 'Verify'}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }
);

EmailCard.displayName = 'EmailCard';
