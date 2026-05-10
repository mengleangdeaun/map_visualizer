import React from 'react';
import { Zap } from 'lucide-react';

export const RoutingFooter: React.FC = () => {
    return (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Zap className="size-5" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Smart Routing</p>
                    <p className="text-[10px] text-zinc-500 font-bold">OSRM Real-time Geometries</p>
                </div>
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
        </div>
    );
};
