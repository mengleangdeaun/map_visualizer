import React from 'react';
import { Card } from '@/components/ui/card';
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
  const formattedDate = task.scheduled_at
    ? new Date(task.scheduled_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No Date';

  return (
    <Card className="p-4 border bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all rounded-2xl flex flex-col gap-3 h-full justify-between animate-fade-in">
      {/* Top: Customer & Priority Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none mb-1">
            {task.contact_name || 'Anonymous Customer'}
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground leading-snug truncate">
            {task.title || 'Untitled Delivery Task'}
          </span>
        </div>

        {/* Task Priority & Status Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-full',
              getPriorityStyles(task.priority || 'LOW')
            )}
          >
            {task.priority || 'LOW'}
          </span>

          {task.status === 'completed' ? (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center gap-0.5">
              <CheckCircle2 size={8} />
              {t('driver:completed') || 'Done'}
            </span>
          ) : (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full flex items-center gap-0.5">
              <XCircle size={8} />
              {t('driver:cancelled') || 'Void'}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Addresses */}
      <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-muted/30">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={11} className="text-primary shrink-0" />
          <span className="truncate">{task.pickup_address || 'No pickup address'}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0 border-t pt-1.5 border-muted/40">
          <MapPin size={11} className="text-muted-foreground shrink-0" />
          <span className="truncate">{task.dropoff_address || 'No dropoff address'}</span>
        </div>
      </div>

      {/* Bottom: Date Time stamp & Details */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold border-t pt-2.5">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formattedDate}
        </span>
        {task.vehicle?.plate_number && (
          <span className="bg-muted px-2 py-0.5 rounded font-black tracking-wide">
            {task.vehicle.plate_number}
          </span>
        )}
      </div>
    </Card>
  );
});

TaskHistoryCard.displayName = 'TaskHistoryCard';
