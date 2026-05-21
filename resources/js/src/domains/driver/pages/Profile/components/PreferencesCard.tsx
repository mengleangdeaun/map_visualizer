import React from 'react';
import { Globe, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageOption } from '../types';

interface PreferencesCardProps {
  currentLanguage: string;
  activeVehicle: any;
  onChangeLanguage: (code: string) => void;
  t: (key: string) => string;
}

// Memoized language button to avoid re‑renders of siblings
const LanguageButton = React.memo(
  ({
    code,
    label,
    isActive,
    onClick,
  }: {
    code: string;
    label: string;
    isActive: boolean;
    onClick: (code: string) => void;
  }) => (
    <button
      onClick={() => onClick(code)}
      className={cn(
        'relative flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ease-out',
        isActive
          ? 'bg-white text-primary shadow-sm shadow-primary/10'
          : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
      )}
    >
      {label}
    </button>
  )
);

LanguageButton.displayName = 'LanguageButton';

export const PreferencesCard = React.memo(
  ({ currentLanguage, activeVehicle, onChangeLanguage, t }: PreferencesCardProps) => {
    const languages: LanguageOption[] = [
      { code: 'en', label: 'English' },
      { code: 'kh', label: 'ខ្មែរ' },
      { code: 'zh', label: '中文' },
    ];

    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Globe size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800">
            {t('driver:preferences') || 'Preferences'}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-3">
            {t('driver:app_language') || 'App Language'}
          </p>
          <div className="flex bg-gray-100 p-1 rounded-full gap-1">
            {languages.map((lang) => (
              <LanguageButton
                key={lang.code}
                code={lang.code}
                label={lang.label}
                isActive={currentLanguage.startsWith(lang.code)}
                onClick={onChangeLanguage}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-500">
            <Navigation size={14} />
            <span className="text-xs font-semibold">
              {t('driver:tracking_telemetry') || 'Tracking Telemetry'}
            </span>
          </div>
          <span
            className={cn(
              'text-[10px] font-bold uppercase px-3 py-1 rounded-full transition-all duration-300',
              activeVehicle ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
            )}
          >
            {activeVehicle ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </div>
    );
  }
);

PreferencesCard.displayName = 'PreferencesCard';
