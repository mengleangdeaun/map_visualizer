import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../../components/BottomSheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate: string;
    initialStatus: string;
    onApply: (date: string, status: string) => void;
    onReset: () => void;
}

export const HistoryFilterSheet: React.FC<HistoryFilterSheetProps> = ({
    isOpen,
    onClose,
    initialDate,
    initialStatus,
    onApply,
    onReset,
}) => {
    const { t } = useTranslation(['driver', 'system']);
    const [tempDate, setTempDate] = useState(initialDate);
    const [tempStatus, setTempStatus] = useState(initialStatus);

    const handleApply = () => {
        onApply(tempDate, tempStatus);
        onClose();
        if ('vibrate' in navigator) navigator.vibrate(15);
    };

    const handleReset = () => {
        setTempDate('');
        setTempStatus('all');
        onReset();
        onClose();
        if ('vibrate' in navigator) navigator.vibrate(10);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} className="flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between border-b pb-3.5">
                <h2 className="text-sm font-black tracking-tight text-foreground flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-primary" />
                    {t('driver:filter_routes') || 'Filter Route History'}
                </h2>
                <button 
                    onClick={handleReset}
                    className="text-[10px] font-black uppercase text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
                >
                    <RotateCcw size={10} />
                    {t('driver:reset_all') || 'Reset All'}
                </button>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {t('driver:filter_by_date') || 'Filter by Date'}
                </label>
                <input 
                    type="date" 
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="w-full h-11 rounded-xl border bg-background px-3.5 text-xs font-bold tracking-tight text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {t('driver:filter_by_status') || 'Filter by Status'}
                </label>
                <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1 rounded-xl">
                    {([
                        { code: 'all', label: t('driver:all') || 'All' },
                        { code: 'completed', label: t('driver:completed') || 'Done' },
                        { code: 'in_progress', label: t('driver:in_progress') || 'Active' }
                    ] as const).map((stat) => (
                        <button
                            key={stat.code}
                            type="button"
                            onClick={() => setTempStatus(stat.code)}
                            className={cn(
                                "py-2 rounded-lg text-xs font-black transition-all",
                                tempStatus === stat.code 
                                    ? "bg-background text-primary shadow-sm border border-border" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {stat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Buttons: Apply / Close */}
            <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-wider"
                    onClick={onClose}
                >
                    {t('driver:close') || 'Close'}
                </Button>
                <Button 
                    className="flex-1 rounded-xl h-11 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                    onClick={handleApply}
                >
                    {t('driver:apply_filters') || 'Apply Filters'}
                </Button>
            </div>
        </BottomSheet>
    );
};
