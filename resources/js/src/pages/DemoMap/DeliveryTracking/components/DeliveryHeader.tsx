import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface DeliveryHeaderProps {
    status: string;
    eta: number;
    formatDuration: (mins: number) => string;
}

export const DeliveryHeader: React.FC<DeliveryHeaderProps> = ({ status, eta, formatDuration }) => {
    return (
        <CardHeader className="p-4 pt-0 pb-0">
            <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-none px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">
                    {status}
                </Badge>
                {eta > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Clock className="size-3 text-emerald-500" />
                        <span>{formatDuration(eta)}</span>
                    </div>
                )}
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight leading-tight">
                {status === 'Delivered' ? 'Delivery Complete' : status === 'On the way' ? `Arriving Soon` : 'New Delivery'}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground/80 mt-1">
                {status === 'Select Pickup Location' ? 'Choose a starting point on the map' : 
                 status === 'Select Dropoff Location' ? 'Set the final destination' :
                 'Real-time logistics engine active'}
            </CardDescription>
        </CardHeader>
    );
};
