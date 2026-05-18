import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLocationService } from '../../hooks/useLocationService';
import { PwaToast } from '../PwaToast';

export const MobileLayout = () => {
    const { isTracking } = useLocationService();

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
