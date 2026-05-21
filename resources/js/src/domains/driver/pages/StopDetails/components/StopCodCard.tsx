import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import type { RouteStop } from '../types';

interface StopCodCardProps {
    stop: RouteStop;
}

export const StopCodCard: React.FC<StopCodCardProps> = ({ stop }) => {
    const { order } = stop.delivery;

    return (
        <Card className="p-4 border-none shadow-md bg-card flex items-center justify-between">
            <div className="space-y-0.5">
                <span className="text-xs font-bold text-muted-foreground uppercase block">
                    COD Amount Due
                </span>
                <span className="text-xs font-bold text-primary italic uppercase block">
                    Method: {order.payment_method}
                </span>
            </div>
            <div className="flex items-center font-black text-2xl text-foreground">
                <DollarSign size={20} className="text-emerald-500" />
                <span>{order.amount_due_cod.toFixed(2)}</span>
            </div>
        </Card>
    );
};
