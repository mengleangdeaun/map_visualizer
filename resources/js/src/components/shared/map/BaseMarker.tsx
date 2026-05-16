import React from 'react';
import { cn } from '@/lib/utils';

interface PushPinProps {
    color?: string;
    isFocused?: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * Base PushPin Component - The single source of truth for the marker UI.
 * Standardized circular head with a vertical needle.
 */
export const PushPin = ({ 
    color = "bg-primary", 
    isFocused, 
    children,
    className
}: PushPinProps) => {
    // Extract hex/tailwind color if needed, but here we assume 'color' is a tailwind class like 'bg-emerald-500'
    const colorClass = color.startsWith('bg-') ? color : `bg-[${color}]`;
    const ringColorClass = color.replace('bg-', 'ring-');

    return (
        <div className={cn(
            "relative group flex flex-col items-center transition-all duration-500 ease-out",
            isFocused ? "scale-110 z-50" : "scale-100 hover:scale-105",
            className
        )}>
            {/* Glow Effect */}
            <div className={cn(
                "absolute -inset-2 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500",
                colorClass
            )} />

            {/* Circular Head */}
            <div className={cn(
                "relative size-8 rounded-full border-2 border-white shadow-[0_8px_16px_rgb(0,0,0,0.15)] flex items-center justify-center z-10 transition-colors",
                colorClass,
                isFocused && "ring-2 ring-offset-1",
                isFocused && `${ringColorClass}/30`
            )}>
                {children}
            </div>

            {/* Vertical Needle/Line */}
            <div className={cn(
                "w-0.5 h-3 -mt-0.5 shadow-sm transition-colors",
                colorClass
            )} />
            
            {/* Base Dot (Anchor) */}
            <div className={cn(
                "size-1.5 rounded-full border border-white shadow-sm -mt-0.5",
                colorClass
            )} />
        </div>
    );
};

/**
 * Standardized Label Component for all markers
 */
export const MapLabel = ({ 
    children, 
    isFocused, 
    className,
    type = 'default' 
}: { 
    children: React.ReactNode, 
    isFocused?: boolean, 
    className?: string,
    type?: 'pickup' | 'dropoff' | 'default'
}) => {
    return (
        <div className={cn(
            "bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all",
            isFocused ? "border-primary/40 ring-1 ring-primary/10 scale-110" : "border-border/50",
            className
        )}>
            <span className={cn(
                "text-[10px] font-black uppercase tracking-tighter transition-colors",
                isFocused ? "text-primary" : "text-foreground/70",
                type === 'pickup' && !isFocused && "text-emerald-600/80",
                type === 'dropoff' && !isFocused && "text-red-600/80",
            )}>
                {children}
            </span>
        </div>
    );
};
