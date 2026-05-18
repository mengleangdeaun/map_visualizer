import React from 'react';
import { ClipboardList } from 'lucide-react';

interface FloatingErrandTriggerProps {
    visible: boolean;
    onClick: () => void;
}

export const FloatingErrandTrigger: React.FC<FloatingErrandTriggerProps> = ({
    visible,
    onClick
}) => {
    if (!visible) return null;

    return (
        <div className="absolute bottom-[30px] left-0 right-0 z-30 flex justify-center pointer-events-none">
            <button
                onClick={onClick}
                className="h-10 px-5 rounded-full bg-background/90 backdrop-blur-md border border-border/50 text-foreground font-semibold text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-background active:scale-95 transition-all pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
                <ClipboardList size={15} className="text-primary animate-pulse" />
                <span>Show Errand Details</span>
            </button>
        </div>
    );
};
