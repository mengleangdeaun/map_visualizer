import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Car, Bike, Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Driver } from '../types';

interface DriverListProps {
    drivers: Driver[];
    onSelect: (driver: Driver) => void;
    selectedId?: string;
}

export const DriverList = ({ drivers, onSelect, selectedId }: DriverListProps) => {
    return (
        <Card className="flex flex-col h-full bg-card border shadow-sm">
            <CardHeader className="p-4 border-b pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                    Nearby Drivers
                    <Badge variant="secondary" className="text-[10px] h-5">{drivers.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                        {drivers.map((driver) => (
                            <button
                                key={driver.id}
                                onClick={() => onSelect(driver)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                                    "hover:bg-accent group",
                                    selectedId === driver.id ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20" : "border-transparent"
                                )}
                            >
                                <div className={cn(
                                    "size-10 rounded-full flex items-center justify-center shrink-0 border-2 border-background shadow-sm transition-colors",
                                    selectedId === driver.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-background"
                                )}>
                                    {driver.vehicleType === 'car' ? <Car className="size-5" /> : <Bike className="size-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <h4 className="text-sm font-bold truncate">{driver.name}</h4>
                                        <div className="flex items-center text-[10px] font-bold text-orange-500 shrink-0">
                                            <Star className="size-3 fill-current mr-0.5" />
                                            {driver.rating}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center">
                                            <MapPin className="size-3 mr-1" />
                                            {(driver.distance).toFixed(2)} km away
                                        </p>
                                        <Badge 
                                            variant="outline" 
                                            className={cn(
                                                "text-[9px] px-1.5 h-4 uppercase tracking-tighter border-0",
                                                driver.status === 'online' ? "text-emerald-600 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10"
                                            )}
                                        >
                                            {driver.status}
                                        </Badge>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
