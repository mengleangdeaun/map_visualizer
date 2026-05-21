import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

interface ActiveFilterAlertProps {
  hasActiveFilters: boolean;
  onReset: () => void;
  t: (key: string) => string;
}

export const ActiveFilterAlert = React.memo(
  ({ hasActiveFilters, onReset, t }: ActiveFilterAlertProps) => {
    if (!hasActiveFilters) return null;

    return (
      <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-3.5 py-2">
        <span className="text-[10px] font-bold text-primary flex items-center gap-1.5">
          <SlidersHorizontal size={12} />
          {t('driver:active_filters') || 'Active filters applied'}
        </span>
        <button
          onClick={onReset}
          className="text-[9px] font-black uppercase text-primary/80 hover:text-primary flex items-center gap-1"
        >
          <RotateCcw size={10} />
          {t('driver:clear') || 'Clear'}
        </button>
      </div>
    );
  }
);

ActiveFilterAlert.displayName = 'ActiveFilterAlert';
