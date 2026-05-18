import React, { useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLocationService } from '../../hooks/useLocationService';
import { useActiveShift } from '../../hooks/useDriverShift';
import { PwaToast } from '../PwaToast';

export const MobileLayout = () => {
    const { isTracking, startTracking, stopTracking, error } = useLocationService();
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
            <div className="flex flex-col min-h-screen bg-muted selection:bg-primary/20">
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
