import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';
import { HistoricalRoute } from '../types';
import {
  Clock,
  MapPin,
  User,
  Package,
  FileText,
  Image,
  CheckCircle2,
  XCircle,
  DollarSign,
  Milestone,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StopsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  route: HistoricalRoute | null;
}

export const StopsDrawer: React.FC<StopsDrawerProps> = ({ isOpen, onClose, route }) => {
  const { t } = useTranslation();

  if (!route) return null;

  const formattedDate = new Date(route.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr || !endStr) return '';
    const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
    if (diffMs <= 0) return '';
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return mins > 0 ? `${mins}m` : `${secs}s`;
  };

  const isSingleStop = route.stops?.length === 1;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      className={cn(
        'flex flex-col gap-0 p-0 overflow-hidden rounded-t-[32px]',
        isSingleStop ? 'h-auto max-h-[85vh]' : 'h-[85vh] max-h-[85vh]'
      )}
    >
      {/* Drawer Header */}
      <div className="pt-6 px-5 pb-4 border-b border-gray-100 shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
              <Milestone size={20} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">
                {t('route_run_timeline') || 'Route Timeline'}
              </span>
              <h2 className="text-sm font-black text-gray-800 leading-tight">{formattedDate}</h2>
            </div>
          </div>

          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
              route.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-amber-500/10 text-amber-600'
            )}
          >
            {route.status === 'completed'
              ? t('completed') || 'Completed'
              : t('in_progress') || 'Active'}
          </span>
        </div>

        {/* Route summary stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
          {[
            { label: t('stops') || 'Stops', value: route.stop_count },
            { label: t('distance') || 'km', value: `${route.estimated_distance_km} km` },
            { label: t('duration') || 'min', value: `${route.estimated_duration_min}m` },
            { label: t('weight') || 'kg', value: `${route.total_weight_kg} kg` },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <span className="text-[8px] font-semibold uppercase text-gray-400 tracking-wider leading-none mb-0.5">
                {item.label}
              </span>
              <span className="text-xs font-black text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stops Timeline Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/60">
        {route.stops && route.stops.length > 0 ? (
          route.stops
            .sort((a, b) => a.sequence_number - b.sequence_number)
            .map((stop, index) => {
              const isCompleted = stop.status === 'completed';
              const isSkipped = stop.status === 'skipped';
              const dl = stop.delivery;
              const order = dl?.order;
              const customer = order?.customer;
              const pod = dl?.proof_of_delivery;

              return (
                <div key={stop.id} className="flex gap-3 items-start relative">
                  {/* Vertical connector line */}
                  {index < route.stops.length - 1 && (
                    <span className="absolute left-[15px] top-[34px] bottom-[-20px] w-0.5 bg-gray-200 z-0" />
                  )}

                  {/* Timeline marker */}
                  <div
                    className={cn(
                      'size-8 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs border-4 border-white shadow-sm z-10',
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isSkipped
                        ? 'bg-red-400 text-white'
                        : 'bg-gray-300 text-white'
                    )}
                  >
                    {stop.sequence_number}
                  </div>

                  {/* Stop content card */}
                  <div className="flex-1 bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
                    {/* Status header bar */}
                    <div
                      className={cn(
                        'flex items-center justify-between px-4 py-2.5 border-b border-gray-50',
                        isCompleted ? 'bg-emerald-50/50' : isSkipped ? 'bg-red-50/50' : 'bg-gray-50/50'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={2.5} />
                        ) : isSkipped ? (
                          <XCircle size={13} className="text-red-400" strokeWidth={2.5} />
                        ) : (
                          <Clock size={13} className="text-gray-400" strokeWidth={2} />
                        )}
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider',
                            isCompleted ? 'text-emerald-600' : isSkipped ? 'text-red-500' : 'text-gray-500'
                          )}
                        >
                          {stop.status === 'completed'
                            ? t('delivered') || 'Delivered'
                            : stop.status === 'skipped'
                            ? t('skipped') || 'Skipped'
                            : t('pending') || 'Pending'}
                        </span>
                      </div>

                      {stop.arrived_at && (
                        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                          {formatTime(stop.arrived_at)}
                          {stop.completed_at && (
                            <>
                              <ArrowRight size={9} className="text-gray-300" />
                              {formatTime(stop.completed_at)}
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Stop body */}
                    <div className="p-4 space-y-3">
                      {/* Customer name & address */}
                      <div className="space-y-1.5">
                        {customer?.name && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                            <User size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                            <span>{customer.name}</span>
                          </div>
                        )}
                        {dl?.dropoff_address && (
                          <div className="flex items-start gap-1.5 text-xs font-semibold text-gray-500 leading-snug">
                            <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={2} />
                            <span>{dl.dropoff_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Chips: tracking, COD, time-spent */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {dl?.tracking_number && (
                          <div className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100 text-[10px] font-bold leading-none">
                            <Package size={10} className="text-gray-400" />
                            <span>{dl.tracking_number}</span>
                          </div>
                        )}
                        {order?.payment_method === 'cod' && (
                          <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-100/50 leading-none">
                            <DollarSign size={10} />
                            <span>{order.amount_due_cod?.toFixed(2)} COD</span>
                          </div>
                        )}
                        {stop.arrived_at && stop.completed_at && (
                          <div className="flex items-center gap-1 bg-sky-50 text-sky-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-sky-100/50 leading-none ml-auto">
                            <Clock size={10} />
                            <span>
                              {t('stop_spent') || 'Spent'}:{' '}
                              {calculateDuration(stop.arrived_at, stop.completed_at)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {stop.notes && (
                        <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl text-xs text-amber-800 space-y-1">
                          <div className="flex items-center gap-1 font-bold text-[9px] uppercase tracking-wide text-amber-700/80">
                            <FileText size={10} />
                            <span>{t('stop_notes') || 'Notes'}</span>
                          </div>
                          <p className="font-semibold text-amber-900 leading-snug">{stop.notes}</p>
                        </div>
                      )}

                      {/* Proof of Delivery */}
                      {pod && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                            {t('proof_of_delivery') || 'Proof of Delivery'}
                          </span>
                          {pod.receiver_name && (
                            <div className="text-xs text-gray-600 font-semibold">
                              {t('receiver') || 'Received by'}:{' '}
                              <span className="font-bold text-gray-800">{pod.receiver_name}</span>
                            </div>
                          )}
                          {pod.notes && (
                            <p className="text-xs text-gray-400 italic font-semibold">
                              "{pod.notes}"
                            </p>
                          )}
                          {pod.photo_url && (
                            <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-white max-w-[200px] mt-1 group/img shadow-sm hover:shadow-md transition-shadow">
                              <img
                                src={pod.photo_url}
                                alt="Proof of Delivery"
                                loading="lazy"
                                className="w-full aspect-[4/3] object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200';
                                }}
                              />
                              <a
                                href={pod.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1.5 transition-all text-white text-[10px] font-bold uppercase tracking-wider"
                              >
                                <Eye size={12} />
                                <span>View</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <Package size={36} className="opacity-20 mb-2" />
            <p className="text-xs font-bold">{t('no_stops_recorded') || 'No stops recorded.'}</p>
          </div>
        )}
      </div>

      {/* Close Footer */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={onClose}
          className="w-full h-12 bg-gray-900 text-white rounded-2xl text-sm font-bold uppercase tracking-wider hover:bg-gray-800 active:scale-[0.99] transition-all"
        >
          {t('close') || 'Close'}
        </button>
      </div>
    </BottomSheet>
  );
};
