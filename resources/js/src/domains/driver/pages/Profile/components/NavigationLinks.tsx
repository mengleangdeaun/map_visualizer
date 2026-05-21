import React from 'react';
import { Calendar, Milestone, ChevronRight } from 'lucide-react';

interface NavigationLinksProps {
  onNavigate: (target: string) => void;
  t: (key: string) => string;
}

export const NavigationLinks = React.memo(({ onNavigate, t }: NavigationLinksProps) => {
  return (
    <>
      {/* Task History Link */}
      <div
        onClick={() => onNavigate('/driver/task-history')}
        className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
              {t('driver:analytics_records')}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-tight">{t('driver:task_history')}</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Delivery History Link */}
      <div
        onClick={() => onNavigate('/driver/delivery-history')}
        className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-primary flex items-center justify-center">
            <Milestone size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
              {t('driver:analytics_records')}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-tight">
              {t('driver:delivery_history') || 'Delivery History'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </>
  );
});

NavigationLinks.displayName = 'NavigationLinks';
