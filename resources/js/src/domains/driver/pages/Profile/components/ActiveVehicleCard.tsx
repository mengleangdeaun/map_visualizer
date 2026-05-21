import React from 'react';
import { Truck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/domains/driver/services/driverShiftService';

interface ActiveVehicleCardProps {
  activeVehicle: Vehicle | null;
  isActiveShiftLoading: boolean;
  isCheckOutPending: boolean;
  onCheckOut: () => void;
  t: (key: string) => string;
}

export const ActiveVehicleCard = React.memo(
  ({
    activeVehicle,
    isActiveShiftLoading,
    isCheckOutPending,
    onCheckOut,
    t,
  }: ActiveVehicleCardProps) => {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            <span className="text-sm font-bold text-gray-800">
              {t('driver:active_vehicle') || 'Active Vehicle'}
            </span>
          </div>
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all duration-300',
              activeVehicle ? 'bg-primary animate-pulse' : 'bg-gray-300'
            )}
          />
        </div>

        {isActiveShiftLoading ? (
          <div className="mt-4 h-14 w-full animate-pulse bg-gray-100 rounded-2xl" />
        ) : activeVehicle ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Truck size={22} />
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-tight">{activeVehicle.plate_number}</p>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mt-1">
                  {activeVehicle.type}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full rounded-xl h-11 text-white font-bold text-sm gap-2 bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-transform duration-200"
              onClick={onCheckOut}
              disabled={isCheckOutPending}
            >
              <LogOut size={15} strokeWidth={2.5} />
              {isCheckOutPending
                ? t('driver:checking_out') || 'Checking Out...'
                : t('driver:checkout_shift') || 'Check-out Shift'}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl">
            <Truck size={28} className="text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500 leading-tight">
              {t('driver:no_active_vehicle') || 'No active vehicle checked in'}
            </p>
            <p className="text-xs text-gray-400 mt-1.5 max-w-[220px] leading-relaxed">
              {t('driver:go_to_dashboard_checkin') ||
                'Go to dashboard to check-in to a vehicle to start tracking.'}
            </p>
          </div>
        )}
      </div>
    );
  }
);

ActiveVehicleCard.displayName = 'ActiveVehicleCard';
