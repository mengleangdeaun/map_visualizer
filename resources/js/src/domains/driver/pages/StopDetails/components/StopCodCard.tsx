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
        <div className="p-4 bg-white rounded-2xl shadow-sm shadow-black/5 transition-all duration-300 flex justify-between items-center border-none">
            <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase block">
                    COD Amount Due
                </span>
                <span className="text-xs font-bold text-primary uppercase block">
                    Method: {order.payment_method}
                </span>
            </div>
            <div className="flex items-center font-black text-2xl text-foreground">
                <div className='bg-gray-50/70 p-1.5 px-2 rounded-lg flex items-center gap-1.5'>
                    <span className='font-black text-emerald-500'>{`\$ ${order.amount_due_cod.toFixed(2)}`}</span>
                </div>
            </div>
        </div>
    );
};
