import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Bike, Star, MapPin, Filter, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Driver } from '../types';

interface DriverListProps {
    drivers: Driver[];
    onSelect: (driver: Driver) => void;
    selectedId?: string;
    statusFilter: 'all' | 'online' | 'busy' | 'offline';
    onStatusFilterChange: (filter: 'all' | 'online' | 'busy' | 'offline') => void;
    sortType: 'distance' | 'rating';
    onSortChange: (sort: 'distance' | 'rating') => void;
}

export const DriverList = ({ 
    drivers, 
    onSelect, 
    selectedId,
    statusFilter,
    onStatusFilterChange,
    sortType,
    onSortChange
}: DriverListProps) => {
    return (
        <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 pt-0 pb-0 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <CardTitle className="text-lg">Nearby Drivers</CardTitle>
                        <CardDescription>
                            Live Resources
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px] h-5">
                        {drivers.length}
                    </Badge>
                </div>

                {/* Filter Tabs - Corrected to match system style */}
                <Tabs value={statusFilter} onValueChange={(v: any) => onStatusFilterChange(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-11 p-1">
                        <TabsTrigger value="all" className=" text-[10px] font-bold uppercase tracking-wider">All</TabsTrigger>
                        <TabsTrigger value="online" className=" text-[10px] font-bold uppercase tracking-wider">Live</TabsTrigger>
                        <TabsTrigger value="busy" className=" text-[10px] font-bold uppercase tracking-wider">Busy</TabsTrigger>
                        <TabsTrigger value="offline" className=" text-[10px] font-bold uppercase tracking-wider">Off</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Sort Toggle */}
                <div className="flex items-center justify-between bg-muted/40 p-1 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5 pl-1.5">
                        <ArrowUpDown className="size-3 text-muted-foreground" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sort</span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onSortChange('distance')}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-bold transition-all",
                                sortType === 'distance' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Nearest
                        </button>
                        <button
                            onClick={() => onSortChange('rating')}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-bold transition-all",
                                sortType === 'rating' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Rating
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full border-t">
                    <div className="p-2 space-y-1">
                        {drivers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                <Filter className="size-8 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-tight">No results</p>
                            </div>
                        ) : (
                            drivers.map((driver) => (
                                <button
                                    key={driver.id}
                                    onClick={() => onSelect(driver)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                                        "hover:bg-accent group",
                                        selectedId === driver.id 
                                            ? "bg-accent shadow-xs ring-1 ring-border" 
                                            : "bg-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "size-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-sm",
                                        selectedId === driver.id 
                                            ? "bg-primary text-white border-primary" 
                                            : "bg-muted text-muted-foreground border-background group-hover:bg-background"
                                    )}>
                                        {driver.vehicleType === 'car' ? <Car className="size-5" /> : <Bike className="size-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h4 className="text-sm font-bold truncate tracking-tight">{driver.name}</h4>
                                            <div className="flex items-center text-[10px] font-bold text-orange-500 shrink-0">
                                                <Star className="size-3 fill-current mr-0.5" />
                                                {driver.rating.toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-muted-foreground flex items-center font-semibold">
                                                <MapPin className="size-3 mr-1 text-primary/70" />
                                                {driver.status === 'offline' && driver.lastSeen 
                                                    ? `Seen ${driver.lastSeen}` 
                                                    : `${(driver.distance).toFixed(2)} km`
                                                }
                                            </p>
                                            <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "text-[8px] px-1.5 h-4 uppercase font-bold tracking-tighter border-0",
                                                    driver.status === 'online' ? "text-emerald-600 bg-emerald-500/10" : 
                                                    driver.status === 'busy' ? "text-amber-600 bg-amber-500/10" :
                                                    "text-slate-500 bg-slate-500/10"
                                                )}
                                            >
                                                {driver.status === 'online' ? 'Live' : driver.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
