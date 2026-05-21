import React from 'react';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { RouteStop } from '../types';

interface StopItemsCardProps {
    stop: RouteStop;
}

export const StopItemsCard: React.FC<StopItemsCardProps> = ({ stop }) => {
    const dl = stop.delivery;

    return (
        <Card className="p-4 border-none shadow-md bg-card space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <Package size={18} className="text-primary" />
                <h3 className="font-bold text-base text-foreground">Items to Deliver</h3>
            </div>

            <div className="divide-y divide-border/50">
                {dl.order.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                        <div>
                            <p className="font-bold text-foreground">{item.product_name}</p>
                            <span className="text-[10px] text-muted-foreground uppercase">
                                SKU: {item.sku ?? 'N/A'}
                            </span>
                        </div>
                        <span className="font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                            x{item.quantity}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>Parcel Weight:</span>
                <span className="font-semibold">{dl.weight_kg.toFixed(2)} kg</span>
            </div>
        </Card>
    );
};
