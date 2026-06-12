import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { DollarSign, Route } from 'lucide-react';

interface RouteMetricsCardProps {
    completedCount: number;
    totalStops: number;
    cashToRemit: number;
}

export const RouteMetricsCard: React.FC<RouteMetricsCardProps> = ({
    completedCount,
    totalStops,
    cashToRemit,
}) => {
    const { t } = useTranslation();

    return (
        <div className="p-4 bg-white rounded-2xl shadow-sm shadow-black/5 transition-all duration-300 flex items-center justify-between border-none">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <Route size={20} />
                </div>
                <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        {t('route_progress') || 'Route Progress'}
                    </span>
                    <h2 className="text-lg font-black text-foreground tracking-tight">
                        {completedCount} / {totalStops}{' '}
                        <span className="text-xs font-medium text-muted-foreground">
                            {t('stops_completed') || 'Completed'}
                        </span>
                    </h2>
                </div>
            </div>

            <div className="text-right space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    {t('expected_cod') || 'Expected COD'}
                </span>
                <div className="inline-flex items-center font-black text-base bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-xl gap-0.5 text-emerald-600">
                    <DollarSign size={14} className="stroke-[3]" />
                    <span>{cashToRemit.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};