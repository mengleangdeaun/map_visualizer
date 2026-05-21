import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: string;
  initialStatus: string;
  onApply: (date: string, status: string) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { code: 'all', labelKey: 'driver:all', fallback: 'All' },
  { code: 'completed', labelKey: 'driver:completed', fallback: 'Done' },
  { code: 'in_progress', labelKey: 'driver:in_progress', fallback: 'Active' },
] as const;

export const HistoryFilterSheet: React.FC<HistoryFilterSheetProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialStatus,
  onApply,
  onReset,
}) => {
  const { t } = useTranslation(['driver', 'system']);
  const [tempDate, setTempDate] = useState(initialDate);
  const [tempStatus, setTempStatus] = useState(initialStatus);

  // Sync local state when the sheet re-opens with updated external filter
  useEffect(() => {
    if (isOpen) {
      setTempDate(initialDate);
      setTempStatus(initialStatus);
    }
  }, [isOpen, initialDate, initialStatus]);

  const handleApply = () => {
    onApply(tempDate, tempStatus);
    onClose();
  };

  const handleReset = () => {
    setTempDate('');
    setTempStatus('all');
    onReset();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6 px-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <SlidersHorizontal size={18} strokeWidth={2} />
            </div>
            {t('driver:filter_routes') || 'Filter Route History'}
          </h2>
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-red-500 hover:text-red-600 active:scale-95 transition-transform"
          >
            {t('driver:reset_all') || 'Reset All'}
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
            {t('driver:filter_by_date') || 'Filter by Date'}
          </label>
          <input
            type="date"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
            className="w-full h-12 rounded-2xl bg-gray-50 border-0 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all appearance-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
            {t('driver:filter_by_status') || 'Filter by Status'}
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-2xl">
            {STATUS_OPTIONS.map((stat) => (
              <button
                key={stat.code}
                type="button"
                onClick={() => setTempStatus(stat.code)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                  tempStatus === stat.code
                    ? 'bg-white text-primary shadow-sm shadow-primary/10'
                    : 'text-gray-500 hover:text-gray-700 active:bg-gray-200/50'
                )}
              >
                {t(stat.labelKey) || stat.fallback}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-12 text-sm font-bold text-gray-600 border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
            onClick={onClose}
          >
            {t('driver:close') || 'Close'}
          </Button>
          <Button
            className="flex-1 rounded-2xl h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            onClick={handleApply}
          >
            {t('driver:apply_filters') || 'Apply Filters'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
