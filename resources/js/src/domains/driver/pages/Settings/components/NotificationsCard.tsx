import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';

interface NotificationsCardProps {
  pushEnabled: boolean;
  isSavePending: boolean;
  isDeletePending: boolean;
  onToggle: (checked: boolean) => void;
  t: (key: string) => string;
}

export const NotificationsCard = React.memo(
  ({ pushEnabled, isSavePending, isDeletePending, onToggle, t }: NotificationsCardProps) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3.5">
          <div className="size-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Bell size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider leading-none mb-0.5">
              {t('driver:alerts') || 'Alerts'}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-tight">
              {t('driver:push_notifications') || 'Push Notifications'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex flex-col pr-4 min-w-0">
            <span className="text-xs font-bold text-gray-800 tracking-tight leading-none mb-1.5">
              {t('driver:enable_vapid_pushes') || 'VAPID Push Service'}
            </span>
            <span className="text-[10px] font-semibold text-gray-400 leading-relaxed">
              {t('driver:push_desc') || 'Receive task assignments and shift alerts on this device.'}
            </span>
          </div>

          <Switch
            checked={pushEnabled}
            onCheckedChange={onToggle}
            disabled={isSavePending || isDeletePending}
          />
        </div>
      </div>
    );
  }
);

NotificationsCard.displayName = 'NotificationsCard';
