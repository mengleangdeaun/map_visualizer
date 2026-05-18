import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    onRefresh: () => Promise<any>;
    children: React.ReactNode;
    className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef(0);
    const hasVibratedRef = useRef(false);

    const THRESHOLD = 65; // px distance required to trigger refresh
    const MAX_PULL = 110;  // max px translation allowed

    const handleTouchStart = (e: TouchEvent) => {
        // Only trigger pull-to-refresh if the scroll container is scrolled to the absolute top
        const container = containerRef.current;
        if (!container || container.scrollTop > 0 || isRefreshing) return;

        touchStartRef.current = e.touches[0].clientY;
        setIsPulling(true);
        hasVibratedRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diffY = currentY - touchStartRef.current;

        // Only allow pulling down (positive distance)
        if (diffY > 0) {
            // Apply exponential-like resistance (elastic feel)
            const dampingFactor = 0.45;
            const targetDistance = Math.min(diffY * dampingFactor, MAX_PULL);
            setPullDistance(targetDistance);

            // Trigger light PWA haptic feedback vibration when crossing the threshold
            if (targetDistance >= THRESHOLD && !hasVibratedRef.current) {
                if ('vibrate' in navigator) {
                    navigator.vibrate(15);
                }
                hasVibratedRef.current = true;
            } else if (targetDistance < THRESHOLD && hasVibratedRef.current) {
                hasVibratedRef.current = false;
            }

            // Prevent default scroll bounce behavior when dragging down at top
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling) return;
        setIsPulling(false);

        if (pullDistance >= THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(50); // Settle in loading state position

            try {
                await onRefresh();
            } catch (err) {
                console.error('Pull-to-refresh failed:', err);
            } finally {
                // Return gracefully
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            // Snap back
            setPullDistance(0);
        }
    };

    // Attach passive: false listeners manually to allow e.preventDefault() in Chrome/iOS Safari
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, isRefreshing]);

    // Calculate rotation and scale percentages
    const pullPercent = Math.min(pullDistance / THRESHOLD, 1);
    const rotation = pullPercent * 360;
    const scale = Math.min(pullDistance / 35, 1);

    return (
        <div 
            ref={containerRef} 
            className={cn("relative overflow-y-auto w-full h-full select-none touch-pan-y", className)}
        >
            {/* Pull Indicator Container */}
            <div 
                className="absolute left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-150"
                style={{ 
                    height: '50px', 
                    top: `${pullDistance - 50}px`,
                    opacity: pullDistance > 10 ? 1 : 0
                }}
            >
                <div className="flex items-center justify-center size-9 rounded-full bg-background border shadow-md shadow-primary/5 transition-transform">
                    {isRefreshing ? (
                        <Loader2 className="size-5 text-primary animate-spin" />
                    ) : (
                        <div 
                            style={{ 
                                transform: `rotate(${rotation}deg) scale(${scale})`,
                                opacity: pullPercent
                            }}
                            className="transition-transform duration-75 flex items-center justify-center text-primary"
                        >
                            <ArrowDown className="size-5" />
                        </div>
                    )}
                </div>
            </div>

            {/* Inner Content Area */}
            <div 
                className={cn("w-full h-full", { "transition-transform duration-300": !isPulling })}
                style={{ 
                    transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : 'none' 
                }}
            >
                {children}
            </div>
        </div>
    );
};
