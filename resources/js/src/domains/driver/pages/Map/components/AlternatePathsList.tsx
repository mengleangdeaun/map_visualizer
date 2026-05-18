import React from 'react';
import { Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlternatePathsListProps {
    visible: boolean;
    routes: any[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onClose: () => void;
}

export const AlternatePathsList: React.FC<AlternatePathsListProps> = ({
    visible,
    routes,
    selectedIndex,
    onSelect,
    onClose
}) => {
    if (!visible || routes.length === 0) return null;

    return (
        <div className="absolute top-[72px] left-4 right-4 z-30 max-w-sm mx-auto bg-background/85 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-xl space-y-3 animate-in slide-in-from-top duration-250">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Navigation size={14} className="text-primary animate-pulse" />
                    Alternate Paths
                </h4>
                <button 
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 text-muted-foreground transition-all"
                >
                    <X size={14} />
                </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {routes.map((route, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(idx)}
                        className={cn(
                            "w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center gap-2",
                            idx === selectedIndex 
                                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                                : "bg-muted/30 border-border/50 hover:bg-muted/50 text-muted-foreground"
                        )}
                    >
                        <div className="flex flex-col">
                            <span className="font-black text-xs text-foreground">
                                Route #{idx + 1} {idx === 0 && "(Fastest)"}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                                {(route.distance / 1000).toFixed(2)} km
                            </span>
                        </div>
                        <span className="font-bold text-xs text-foreground">
                            {Math.round(route.duration / 60)} mins
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
