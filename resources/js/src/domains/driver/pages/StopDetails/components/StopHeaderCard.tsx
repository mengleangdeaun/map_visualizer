import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusLabel } from '../hooks/useStopDetails';
import type { RouteStop } from '../types';

interface StopHeaderCardProps {
    stop: RouteStop;
    onOpenNavigation: () => void;
}

export const StopHeaderCard: React.FC<StopHeaderCardProps> = ({ stop, onOpenNavigation }) => {
    const dl = stop.delivery;
    const status = getStatusLabel(stop.status, dl.status);
    const showNavButton = stop.status === 'pending' || stop.status === 'arrived';

    return (
        <Card className="p-4 border-none shadow-md bg-card flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">
                            Stop #{stop.sequence_number}
                        </span>
                        <Badge className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            status.className
                        )}>
                            {status.label}
                        </Badge>
                    </div>
                    <h2 className="text-xl font-black text-foreground tracking-tight mt-1">
                        {dl.order.customer.name}
                    </h2>
                </div>
                <a
                    href={`tel:${dl.order.customer.phone}`}
                    className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 active:scale-95 transition-all"
                >
                    <Phone size={18} />
                </a>
            </div>

            <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                    <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                    <span>{dl.dropoff_address}</span>
                </div>

                {showNavButton && (
                    <Button
                        onClick={onOpenNavigation}
                        variant="outline"
                        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 font-bold"
                    >
                        <Navigation size={16} className="text-primary" />
                        Open Map Navigation
                    </Button>
                )}
            </div>
        </Card>
    );
};
