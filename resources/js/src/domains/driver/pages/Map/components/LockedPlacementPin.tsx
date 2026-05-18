import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LockedPlacementPinProps {
    visible: boolean;
}

export const LockedPlacementPin: React.FC<LockedPlacementPinProps> = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <div className="relative flex flex-col items-center justify-center">
                {/* Ground Pulsing Touchpoint Ring */}
                <div className="absolute bottom-0 w-3 h-3 bg-destructive/15 rounded-full border border-destructive/20 animate-ping opacity-60" />
                
                {/* Soft Ground Shadow */}
                <div className="absolute bottom-0 w-3 h-3 bg-black/25 rounded-full blur-[1px] animate-pulse" style={{ animationDuration: '2s' }} />

                {/* Bouncing Pin Structure */}
                <div className="relative flex flex-col items-center animate-bounce -translate-y-4" style={{ animationDuration: '2s' }}>
                    {/* 1. Rounded-Full Header Circle */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-destructive to-red-500 text-white flex items-center justify-center border-[3px] border-white shadow-xl relative z-10">
                        <AlertTriangle size={20} className="animate-pulse" />
                    </div>
                    
                    {/* 2. Straight Vertical Line Needle Body */}
                    <div className="w-[3px] h-6 bg-white shadow-sm relative z-0 -mt-0.5" />
                    
                    {/* 3. Tip Pin-point Dot */}
                    <div className="w-2 h-2 rounded-full bg-destructive border-2 border-white -mt-1.5 shadow-sm relative z-10" />
                </div>
            </div>
        </div>
    );
};
