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
      <BottomSheet isOpen={isOpen} onClose={onClose} className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b pb-3.5">
          <h2 className="text-sm font-black tracking-tight text-foreground flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-primary" />
            {t('driver:filter_tasks') || 'Filter Task History'}
          </h2>
          <button
            onClick={onReset}
            className="text-[10px] font-black uppercase text-destructive hover:text-destructive/80 transition-colors"
          >
            {t('driver:reset_all') || 'Reset All'}
          </button>
        </div>

        {/* Filter Segment 1: Date */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {t('driver:filter_by_date') || 'Filter by Date'}
          </label>
          <div className="relative">
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full h-10 rounded-xl border bg-background px-3.5 text-xs font-black tracking-tight text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Segment 2: Status */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {t('driver:filter_by_status') || 'Filter by Status'}
          </label>
          <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1 rounded-xl">
            {([
              { code: 'all', label: t('driver:all') || 'All' },
              { code: 'completed', label: t('driver:completed') || 'Done' },
              { code: 'cancelled', label: t('driver:cancelled') || 'Void' },
            ] as const).map((stat) => (
              <button
                key={stat.code}
                type="button"
                onClick={() => setTempStatus(stat.code)}
                className={cn(
                  'py-2 rounded-lg text-xs font-black transition-all',
                  tempStatus === stat.code
                    ? 'bg-background text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {stat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Segment 3: Priority */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {t('driver:filter_by_priority') || 'Filter by Priority'}
          </label>
          <div className="grid grid-cols-5 gap-1 bg-muted/30 p-1 rounded-xl">
            {([
              { code: 'all', label: t('driver:all') || 'All' },
              { code: 'low', label: t('driver:priority_low') || 'Low' },
              { code: 'normal', label: t('driver:priority_normal') || 'Normal' },
              { code: 'high', label: t('driver:priority_high') || 'High' },
              { code: 'urgent', label: t('driver:priority_urgent') || 'Urgent' },
            ] as const).map((prio) => (
              <button
                key={prio.code}
                type="button"
                onClick={() => setTempPriority(prio.code)}
                className={cn(
                  'py-2 rounded-lg text-[10px] font-black transition-all',
                  tempPriority === prio.code
                    ? 'bg-background text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {prio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons: Apply / Close */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-wider"
            onClick={onClose}
          >
            {t('driver:close') || 'Close'}
          </Button>
          <Button
            className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
            onClick={onApply}
          >
            {t('driver:apply_filters') || 'Apply Filters'}
          </Button>
        </div>
      </BottomSheet>
    );
  }
);

FilterSheet.displayName = 'FilterSheet';
