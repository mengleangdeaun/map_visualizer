import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Flag, Package, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectionMode } from '../types';

interface SelectionOverlayProps {
    selectionMode: SelectionMode;
    onCancel: () => void;
}

export const SelectionOverlay = React.memo(({ selectionMode, onCancel }: SelectionOverlayProps) => {
    const { t } = useTranslation(['admin']);

    if (selectionMode === 'none') return null;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30">
            <div className="bg-background/95 backdrop-blur-md px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 ring-1 ring-primary/20">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {selectionMode === 'task_pickup' ? (
                        <MapPin className="size-4 text-emerald-500" />
                    ) : selectionMode === 'task_dropoff' ? (
                        <Flag className="size-4 text-red-500" />
                    ) : selectionMode === 'delivery_dropoff' ? (
                        <Package className="size-4 text-indigo-500" />
                    ) : (
                        <AlertTriangle className="size-4 text-red-500 animate-bounce" />
                    )}
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-foreground">
                        {selectionMode === 'task_pickup' 
                            ? t('admin:click_to_set_pickup') || 'Click to set Pickup' 
                            : selectionMode === 'task_dropoff' 
                            ? t('admin:click_to_set_dropoff') || 'Click to set Destination' 
                            : selectionMode === 'delivery_dropoff'
                            ? t('admin:click_to_set_delivery_destination') || 'Click on map to set Destination'
                            : 'Click on map to place Road Block warning'}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Interactive Mode</span>
                </div>
                <Button 
                    size="icon-sm" 
                    variant="ghost" 
                    onClick={onCancel} 
                    className="ml-2 hover:bg-destructive/10 hover:text-destructive rounded-full"
                >
                    <X size={14} />
                </Button>
            </div>
        </div>
    );
});

SelectionOverlay.displayName = 'SelectionOverlay';
