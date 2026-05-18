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
    const { t } = useTranslation(['delivery', 'driver']);

    return (
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-center">
            <div className="flex h-11 items-center bg-background/85 backdrop-blur-md border border-border/50 rounded-full shadow-lg max-w-sm w-full">
                <button
                    onClick={() => onChange('deliveries')}
                    className={cn(
                        "flex-1 h-full rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95",
                        activeFilter === 'deliveries' 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ minHeight: '40px' }} // Target touch minimum size
                >
                    <Package size={16} />
                    {t('delivery:deliveries')}
                </button>
                <button
                    onClick={() => onChange('tasks')}
                    className={cn(
                        "flex-1 h-full rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95",
                        activeFilter === 'tasks' 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ minHeight: '40px' }}
                >
                    <ClipboardList size={16} />
                    {t('delivery:tasks')}
                </button>
            </div>
        </div>
    );
};
