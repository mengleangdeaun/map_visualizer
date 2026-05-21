import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export const BottomSheet = ({ isOpen, onClose, children, className }: BottomSheetProps) => {
    // Handle Esc key and disable body scroll when open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
            {/* Dark Backdrop Overlay */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 cursor-pointer"
                onClick={onClose}
            />

            {/* Bottom Sheet Modal Sheet */}
            <div 
                className={cn(
                    "relative z-50 bg-background border-t rounded-t-[24px] shadow-2xl pt-7 px-6 pb-8 max-w-md w-full mx-auto outline-none",
                    "animate-in slide-in-from-bottom duration-300 ease-out",
                    className
                )}
            >
                {/* Drag Handle Bar Indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 cursor-pointer py-1.5 px-4 z-10" onClick={onClose}>
                    <div className="h-1 w-12 rounded-full bg-gray-400 dark:bg-gray-600 hover:bg-muted-foreground/45 transition-colors" />
                </div>

                {children}
            </div>
        </div>,
        document.body
    );
};
