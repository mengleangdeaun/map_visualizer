import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PriorityType, StatusType } from '../types';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tempDate: string;
  tempStatus: StatusType;
  tempPriority: PriorityType;
  setTempDate: (date: string) => void;
  setTempStatus: (status: StatusType) => void;
  setTempPriority: (priority: PriorityType) => void;
  onApply: () => void;
  onReset: () => void;
  t: (key: string) => string;
}

export const FilterSheet = React.memo(
  ({
    isOpen,
    onClose,
    tempDate,
    tempStatus,
    tempPriority,
    setTempDate,
    setTempStatus,
    setTempPriority,
    onApply,
    onReset,
    t,
  }: FilterSheetProps) => {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col gap-6 px-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <SlidersHorizontal size={18} strokeWidth={2} />
              </div>
              {t('driver:filter_tasks') || 'Filter Task History'}
            </h2>
            <button
              onClick={onReset}
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
            <div className="relative">
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full h-12 rounded-2xl bg-gray-50 border-0 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all appearance-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
              {t('driver:filter_by_status') || 'Filter by Status'}
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-2xl">
              {([
                { code: 'all', label: t('driver:all') || 'All' },
                { code: 'completed', label: t('driver:completed') || 'Done' },
                { code: 'cancelled', label: t('driver:cancelled') || 'Void' },
              ] as const).map((stat) => (
                <button
                  key={stat.code}
                  onClick={() => setTempStatus(stat.code)}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                    tempStatus === stat.code
                      ? 'bg-white text-primary shadow-sm shadow-primary/10'
                      : 'text-gray-500 hover:text-gray-700 active:bg-gray-200/50'
                  )}
                >
                  {stat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
              {t('driver:filter_by_priority') || 'Filter by Priority'}
            </label>
            <div className="grid grid-cols-5 gap-1 bg-gray-100 p-1 rounded-2xl">
              {([
                { code: 'all', label: t('driver:all') || 'All' },
                { code: 'low', label: t('driver:priority_low') || 'Low' },
                { code: 'normal', label: t('driver:priority_normal') || 'Normal' },
                { code: 'high', label: t('driver:priority_high') || 'High' },
                { code: 'urgent', label: t('driver:priority_urgent') || 'Urgent' },
              ] as const).map((prio) => (
                <button
                  key={prio.code}
                  onClick={() => setTempPriority(prio.code)}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold transition-all duration-200',
                    tempPriority === prio.code
                      ? 'bg-white text-primary shadow-sm shadow-primary/10'
                      : 'text-gray-500 hover:text-gray-700 active:bg-gray-200/50'
                  )}
                >
                  {prio.label}
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
              onClick={onApply}
            >
              {t('driver:apply_filters') || 'Apply Filters'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    );
  }
);

FilterSheet.displayName = 'FilterSheet';