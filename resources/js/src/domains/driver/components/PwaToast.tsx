import React, { useEffect, useRef, useState } from 'react';
import { usePwaToastStore, PwaToastType } from '../store/usePwaToastStore';
import { 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    AlertTriangle, 
    X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const PwaToast = () => {
    const { activeToast, dismiss } = usePwaToastStore();
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!activeToast) return;

        // Reset state
        setDragOffset(0);
        setTouchStartY(null);

        const duration = activeToast.duration ?? 3500;

        // Auto close timer
        timerRef.current = window.setTimeout(() => {
            dismiss();
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeToast, dismiss]);

    if (!activeToast) return null;

    // Get icon by type
    const getToastIcon = (type: PwaToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="text-emerald-500 size-5" />;
            case 'error':
                return <AlertCircle className="text-rose-500 size-5" />;
            case 'warning':
                return <AlertTriangle className="text-amber-500 size-5" />;
            case 'info':
            default:
                return <Info className="text-sky-500 size-5" />;
        }
    };

    // Gestures for swipe-up dismiss
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY === null) return;
        const currentY = e.touches[0].clientY;
        const offset = currentY - touchStartY;

        // Only allow upward drag (negative offset)
        if (offset < 0) {
            setDragOffset(offset);
        }
    };

    const handleTouchEnd = () => {
        // If dragged up by more than 45px, dismiss toast
        if (dragOffset < -45) {
            dismiss();
        } else {
            setDragOffset(0); // Snap back
        }
        setTouchStartY(null);
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 h-16 flex items-center justify-center pointer-events-none select-none">
            <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    // Touch screen click fallback dismiss
                    if ('vibrate' in navigator) navigator.vibrate(10);
                }}
                style={{ 
                    transform: `translateY(${dragOffset}px)`,
                    transition: touchStartY === null ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                }}
                className={cn(
                    "pointer-events-auto w-full max-w-sm flex flex-col relative",
                    "bg-card border shadow-lg rounded-full overflow-hidden",
                    "animate-in slide-in-from-top-6 fade-in duration-300 ease-out"
                )}
            >
                <div className="flex items-start gap-3 p-4 pr-9">
                    {/* Status Icon */}
                    <div className="shrink-0 mt-0.5">
                        {getToastIcon(activeToast.type)}
                    </div>

                    {/* Content Texts */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-black tracking-tight text-foreground leading-normal">
                            {activeToast.message}
                        </span>
                        {activeToast.description && (
                            <span className="text-[10px] font-bold text-muted-foreground leading-normal">
                                {activeToast.description}
                            </span>
                        )}
                    </div>

                    {/* Dismiss X Action */}
                    <button 
                        onClick={dismiss}
                        className="absolute top-3.5 right-3 p-1 rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
