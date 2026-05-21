import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapFilterToggleProps {
    activeFilter: 'deliveries' | 'tasks';
    onChange: (filter: 'deliveries' | 'tasks') => void;
}

export const MapFilterToggle: React.FC<MapFilterToggleProps> = ({
    activeFilter,
    onChange
}) => {
    const { t } = useTranslation();

    return (
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-center pointer-events-none">
            <div className="relative flex h-11 items-center bg-card border border-border rounded-full shadow-md max-w-sm w-full p-1 select-none pointer-events-auto">
                {/* Flat Active Pill Indicator (Slides smoothly) */}
                <div 
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-sm transition-all duration-300 ease-out z-0",
                        activeFilter === 'deliveries' ? "left-1 translate-x-0" : "left-1 translate-x-full"
                    )}
                />

                {/* Tab 1: Deliveries */}
                <button
                    onClick={() => onChange('deliveries')}
                    className={cn(
                        "flex-1 h-full rounded-full text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-colors duration-300 z-10 focus:outline-none active:scale-95",
                        activeFilter === 'deliveries' 
                            ? "text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ minHeight: '36px' }}
                >
                    <Package size={14} />
                    <span>{t('deliveries')}</span>
                </button>

                {/* Tab 2: Tasks */}
                <button
                    onClick={() => onChange('tasks')}
                    className={cn(
                        "flex-1 h-full rounded-full text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-colors duration-300 z-10 focus:outline-none active:scale-95",
                        activeFilter === 'tasks' 
                            ? "text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ minHeight: '36px' }}
                >
                    <ClipboardList size={14} />
                    <span>{t('tasks')}</span>
                </button>
            </div>
        </div>
    );
};
