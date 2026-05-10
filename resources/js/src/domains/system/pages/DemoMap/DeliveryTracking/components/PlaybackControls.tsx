import React from 'react';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
    simSpeed: number;
    setSimSpeed: (speed: number) => void;
    isAnimating: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ simSpeed, setSimSpeed, isAnimating }) => {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Playback Speed</label>
            <div className="flex gap-2">
                {[1, 2, 5, 10].map((speed) => (
                    <button
                        key={speed}
                        className={cn(
                            "flex-1 h-9 rounded-md text-[11px] font-bold uppercase transition-all duration-200 border",
                            simSpeed === speed 
                                ? "bg-primary text-primary-foreground shadow-sm border-primary" 
                                : "bg-background text-muted-foreground hover:bg-muted/50 border-input"
                        )}
                        onClick={() => setSimSpeed(speed)}
                        disabled={isAnimating}
                    >
                        {speed === 1 ? "Normal" : `${speed}x`}
                    </button>
                ))}
            </div>
        </div>
    );
};
