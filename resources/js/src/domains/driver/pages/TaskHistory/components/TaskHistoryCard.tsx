import React from 'react';
import { MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HistoryTask } from '../types';

interface TaskHistoryCardProps {
  task: HistoryTask;
  t: (key: string) => string;
}

const getPriorityStyles = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
    case 'high':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'normal':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'low':
      return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export const TaskHistoryCard = React.memo(({ task, t }: TaskHistoryCardProps) => {
  const formattedDate = task.scheduled_at || task.created_at
    ? new Date(task.scheduled_at || task.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No Date';

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm shadow-black/5 hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-3">
      {/* Top: Customer & Priority Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">
            {task.contact_name || 'Anonymous Customer'}
          </span>
          <span className="text-sm font-bold text-gray-800 leading-tight truncate">
            {task.title || 'Untitled Delivery Task'}
          </span>
        </div>

        {/* Priority & Status Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
              getPriorityStyles(task.priority || 'LOW')
            )}
          >
            {task.priority || 'LOW'}
          </span>

          {task.status === 'completed' ? (
            <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-0.5">
              <CheckCircle2 size={10} strokeWidth={2.5} />
              {t('driver:completed') || 'Done'}
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 inline-flex items-center gap-0.5">
              <XCircle size={10} strokeWidth={2.5} />
              {t('driver:cancelled') || 'Void'}
            </span>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100/60 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={14} className="text-primary shrink-0" strokeWidth={2} />
          <span className="font-semibold text-gray-700 truncate">
            {task.pickup_address || 'No pickup address'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0 border-t pt-2 border-gray-100">
          <MapPin size={14} className="text-gray-400 shrink-0" strokeWidth={2} />
          <span className="font-semibold text-gray-700 truncate">
            {task.dropoff_address || 'No dropoff address'}
          </span>
        </div>
      </div>

      {/* Bottom: Date & Plate */}
      <div className="flex items-center justify-between text-[10px] font-bold border-t border-gray-100 pt-2.5">
        <span className="flex items-center gap-1 text-gray-500">
          <Clock size={11} strokeWidth={2} />
          {formattedDate}
        </span>
        {task.vehicle?.plate_number && (
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-black tracking-wide">
            {task.vehicle.plate_number}
          </span>
        )}
      </div>
    </div>
  );
});

TaskHistoryCard.displayName = 'TaskHistoryCard';