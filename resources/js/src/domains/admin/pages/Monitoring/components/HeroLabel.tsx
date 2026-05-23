import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Info, 
    X, 
    Truck, 
    Warehouse, 
    MapPin, 
    Flag, 
    Package, 
    AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { roadblockTypeOptions, RoadblockType } from '@/domains/admin/utils/roadBlockType';
import { ScrollArea } from '@/components/ui/scroll-area';


export const HeroLabel = React.memo(() => {
    const { t } = useTranslation(['admin', 'system']);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-2 font-sans">
            {/* Legend Card Panel */}
            {isOpen && (
                <Card className="w-80 h-[450px] bg-gradient-to-b from-card to-background shadow-2xl rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 overflow-hidden">
                    <div className="flex items-center justify-between border-b pb-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Info className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold uppercase text-foreground">
                                {t('admin:map_legend') || 'Map Legend'}
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full hover:bg-muted p-0 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 h-full min-h-0">
                        {/* Legend Items Sections */}
                        <div className="space-y-4 text-left">
                        {/* 1. Vehicles */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Vehicles</h4>
                            <div className="grid grid-cols-1 gap-2 pl-1">
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="relative size-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                        <Truck size={14} />
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-green-500 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Active Vehicle</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Online & in transit</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="relative size-7 rounded-full bg-destructive text-white flex items-center justify-center shadow-md animate-bounce shadow-destructive/20">
                                        <Truck size={14} className="animate-pulse" />
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-destructive animate-ping" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-destructive">Overspeeding Alert</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Exceeded speed limit</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center shadow-sm">
                                        <Truck size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Inactive Vehicle</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Offline or stopped</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Infrastructure (Hubs) */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Hub Nodes</h4>
                            <div className="grid grid-cols-1 gap-2 pl-1">
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm">
                                        <Warehouse size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Main Sort Node</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Primary shipping center</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-sm">
                                        <Warehouse size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Regional Hub</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Medium distribution node</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
                                        <Warehouse size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Local Node</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Last mile drop-off spot</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Tasks & Deliveries */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Tasks & Deliveries</h4>
                            <div className="grid grid-cols-1 gap-2 pl-1">
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Pickup Point</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Assigned package pickup</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                                        <Flag size={14} className="fill-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Dropoff Destination</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Task destination location</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                                    <div className="size-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                                        <Package size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Delivery Target</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Ongoing active order drop</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-foreground/80 pl-1">
                                    <div className="w-6 h-1 bg-emerald-500 rounded border border-white flex items-center justify-center shadow-sm" />
                                    <div className="flex flex-col">
                                        <span className="font-bold">Active Dispatch Path</span>
                                        <span className="text-[9px] text-muted-foreground leading-none">Road routing connecting endpoints</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Roadblocks & Hazard Alerts */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Roadblocks & Hazards</h4>
                            <div className="grid grid-cols-2 gap-2 pl-1">
                                {Object.values(roadblockTypeOptions).map((option) => (
                                    <div key={option.value} className="flex items-center gap-2 text-xs text-foreground/80">
                                        <div className={cn(
                                            "size-6 rounded-full bg-background border flex items-center justify-center shadow-sm relative shrink-0",
                                            option.border
                                        )}>
                                            <span className={cn("absolute inset-0 rounded-full animate-ping opacity-25", option.pulse)} />
                                            <AlertTriangle className={cn("size-3", option.color)} />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-bold text-[10px] truncate">{option.label.split(' / ')[0]}</span>
                                            <span className="text-[8px] text-muted-foreground uppercase leading-none truncate">{option.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </ScrollArea>
                </Card>
            )}

            {/* Toggle Trigger Info Button */}
            <Button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1.5 px-3 h-9 rounded-full shadow-2xl border font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95",
                    isOpen 
                        ? "bg-primary text-white border-primary hover:bg-primary/90" 
                        : "bg-background/90 text-foreground border-border/50 hover:bg-background/80 hover:text-primary"
                )}
            >
                <Info size={15} />
                <span>{isOpen ? 'Close Legend' : 'Map Legend'}</span>
            </Button>
        </div>
    );
});

HeroLabel.displayName = 'HeroLabel';
