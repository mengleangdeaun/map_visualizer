import React, { useState, useRef, useEffect } from 'react';
import { Layers, AlertTriangle, Route, Check, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface MapHeaderMenuProps {
    mapStyleOption: 'default' | 'google_khmer_hybrid';
    setMapStyleOption: (option: 'default' | 'google_khmer_hybrid') => void;
    routePlanningMode: boolean;
    setRoutePlanningMode: (active: boolean) => void;
    onTriggerReportRoadblock: () => void;
}

export const MapHeaderMenu: React.FC<MapHeaderMenuProps> = ({
    mapStyleOption,
    setMapStyleOption,
    routePlanningMode,
    setRoutePlanningMode,
    onTriggerReportRoadblock
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            {/* Header Right Action Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border border-border/50 text-foreground transition-all duration-200",
                    isOpen 
                        ? "bg-primary text-primary-foreground shadow-inner scale-95" 
                        : "bg-background/85 backdrop-blur-md hover:bg-muted active:scale-95 shadow-sm"
                )}
                style={{ minHeight: '40px', minWidth: '40px' }}
            >
                <Settings size={18} className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
            </button>

            {/* Dropdown Options List */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-card border border-border/50 shadow-2xl p-2.5 space-y-3.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    {/* SECTION A: MAP STYLE STYLE */}
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2.5">
                            Map Layout Style
                        </span>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    setMapStyleOption('default');
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full h-10 px-3 rounded-xl flex items-center justify-between text-left text-xs font-bold transition-all",
                                    mapStyleOption === 'default'
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers size={14} />
                                    <span>Vector (Default)</span>
                                </div>
                                {mapStyleOption === 'default' && <Check size={14} className="stroke-[3]" />}
                            </button>

                            <button
                                onClick={() => {
                                    setMapStyleOption('google_khmer_hybrid');
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full h-10 px-3 rounded-xl flex items-center justify-between text-left text-xs font-bold transition-all",
                                    mapStyleOption === 'google_khmer_hybrid'
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers size={14} />
                                    <span>Google Map</span>
                                </div>
                                {mapStyleOption === 'google_khmer_hybrid' && <Check size={14} className="stroke-[3]" />}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-border/50 my-1" />

                    {/* SECTION B: TOOLS & ACTIONS */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2.5">
                            Driver Map Tools
                        </span>

                        {/* Interactive OSRM Route Planner Switcher */}
                        <div className="flex items-center justify-between h-10 px-3 rounded-xl bg-muted/20 border border-border/10">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <Route size={14} className="text-sky-500" />
                                <span>Custom Route Planner</span>
                            </div>
                            <Switch 
                                checked={routePlanningMode}
                                onCheckedChange={(checked) => {
                                    setRoutePlanningMode(checked);
                                    setIsOpen(false);
                                }}
                            />
                        </div>

                        {/* Report Roadblock Button Trigger */}
                        <button
                            onClick={() => {
                                onTriggerReportRoadblock();
                                setIsOpen(false);
                            }}
                            className="w-full h-10 px-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 transition-all flex items-center gap-2 text-xs font-bold border border-destructive/15 active:scale-95"
                        >
                            <AlertTriangle size={14} className="animate-pulse" />
                            <span>Report Roadblock / Alert</span>
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};
