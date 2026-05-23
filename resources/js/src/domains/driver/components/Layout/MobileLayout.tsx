import React, { useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLocationService } from '../../hooks/useLocationService';
import { useActiveShift } from '../../hooks/useDriverShift';
import { PwaToast } from '../PwaToast';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useDriverNotificationSocket } from '../../pages/Notification/hooks/useDriverNotificationSocket';

export const MobileLayout = () => {
    const { user } = useAuthStore();
    const { isTracking, startTracking, stopTracking, error } = useLocationService();

    // Register global websocket listener for real-time alerts & queries invalidations
    useDriverNotificationSocket({
        userId: user?.id,
    });
    const { data: activeShiftData } = useActiveShift();
    const activeVehicle = activeShiftData?.vehicle || null;

    useEffect(() => {
        if (activeVehicle) {
            if (!isTracking && !error) {
                startTracking();
            }
        } else {
            if (isTracking) {
                stopTracking();
            }
        }
    }, [activeVehicle, isTracking, startTracking, stopTracking, error]);

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col min-h-screen bg-gray-50/80 selection:bg-primary/20">
                <PwaToast />
                <MobileHeader isOnline={isTracking} />
                
                <main className="flex-1 overflow-y-auto pb-24">
                    <Outlet />
                </main>

                <BottomNav />
            </div>
        </TooltipProvider>
    );
};
