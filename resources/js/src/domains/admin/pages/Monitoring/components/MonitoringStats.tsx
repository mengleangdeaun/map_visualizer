import React from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, ClipboardList, MapPin, Activity, ShieldAlert, Warehouse, Eye, EyeOff, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MonitoringStatsProps {
    vehiclesCount: number;
    activeVehiclesCount: number;
    tasksCount: number;
    hubsCount: number;
    deliveriesCount?: number;
    showHubs?: boolean;
    onToggleHubs?: () => void;
    showTasks?: boolean;
    onToggleTasks?: () => void;
    showDeliveries?: boolean;
    onToggleDeliveries?: () => void;
    className?: string;
}

export const MonitoringStats = ({
    vehiclesCount,
    activeVehiclesCount,
    tasksCount,
    hubsCount,
    deliveriesCount = 0,
    showHubs = false,
    onToggleHubs,
    showTasks = true,
    onToggleTasks,
    showDeliveries = true,
    onToggleDeliveries,
    className
}: MonitoringStatsProps) => {
    const { t } = useTranslation('admin');

    return (
        <div className={cn("flex flex-col gap-2 w-40", className)}>
            <Card className="bg-background/95 backdrop-blur-md shadow-xl p-1.5 flex flex-col gap-0 rounded-2xl whitespace-nowrap overflow-hidden border border-border/40">
                {/* Vehicles */}
                <div className="w-full flex items-center justify-between p-2 border-b border-border/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Truck size={14} className="text-primary" />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                                {t('vehicles') || 'Vehicles'}
                            </span>
                            <span className="text-xs font-black">{activeVehiclesCount}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="size-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[7px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Live</span>
                    </div>
                </div>

                {/* Tasks */}
                <div 
                    className={cn(
                        "w-full flex items-center justify-between p-2 border-b border-border/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors group",
                        !showTasks && "opacity-50 grayscale-[0.5]"
                    )}
                    onClick={onToggleTasks}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={cn("p-1.5 rounded-lg transition-colors", showTasks ? "bg-blue-500/10" : "bg-muted")}>
                            <ClipboardList size={14} className={cn("transition-colors", showTasks ? "text-blue-500" : "text-muted-foreground")} />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                                {t('tasks') || 'Tasks'}
                            </span>
                            <span className="text-xs font-black">{tasksCount}</span>
                        </div>
                    </div>
                    <div>
                        {showTasks ? (
                            <div className="p-1 bg-blue-500/10 rounded-md">
                                <Eye size={11} className="text-blue-500" />
                            </div>
                        ) : (
                            <div className="p-1 bg-muted rounded-md">
                                <EyeOff size={11} className="text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Deliveries */}
                <div 
                    className={cn(
                        "w-full flex items-center justify-between p-2 border-b border-border/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors group",
                        !showDeliveries && "opacity-50 grayscale-[0.5]"
                    )}
                    onClick={onToggleDeliveries}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={cn("p-1.5 rounded-lg transition-colors", showDeliveries ? "bg-indigo-500/10" : "bg-muted")}>
                            <Package size={14} className={cn("transition-colors", showDeliveries ? "text-indigo-500" : "text-muted-foreground")} />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                                {t('deliveries') || 'Deliveries'}
                            </span>
                            <span className="text-xs font-black">{deliveriesCount}</span>
                        </div>
                    </div>
                    <div>
                        {showDeliveries ? (
                            <div className="p-1 bg-indigo-500/10 rounded-md">
                                <Eye size={11} className="text-indigo-500" />
                            </div>
                        ) : (
                            <div className="p-1 bg-muted rounded-md">
                                <EyeOff size={11} className="text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Hubs */}
                <div 
                    className={cn(
                        "w-full flex items-center justify-between p-2 cursor-pointer rounded-xl hover:bg-muted/50 transition-colors group",
                        !showHubs && "opacity-50 grayscale-[0.5]"
                    )}
                    onClick={onToggleHubs}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={cn("p-1.5 rounded-lg transition-colors", showHubs ? "bg-orange-500/10" : "bg-muted")}>
                            <Warehouse size={14} className={cn("transition-colors", showHubs ? "text-orange-500" : "text-muted-foreground")} />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                                {t('hubs') || 'Hubs'}
                            </span>
                            <span className="text-xs font-black">{hubsCount}</span>
                        </div>
                    </div>
                    <div>
                        {showHubs ? (
                            <div className="p-1 bg-orange-500/10 rounded-md">
                                <Eye size={11} className="text-orange-500" />
                            </div>
                        ) : (
                            <div className="p-1 bg-muted rounded-md">
                                <EyeOff size={11} className="text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <div className="flex flex-col gap-1 w-full">
                <div className="bg-background/95 backdrop-blur-md border border-border/40 rounded-xl px-2.5 py-1 shadow-sm flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                    <div className="size-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] animate-pulse" />
                    System Optimal
                </div>
                
                {vehiclesCount > activeVehiclesCount && (
                    <div className="bg-background/95 backdrop-blur-md border border-destructive/10 rounded-xl px-2.5 py-1 shadow-sm flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-destructive">
                        <ShieldAlert size={9} />
                        {vehiclesCount - activeVehiclesCount} Offline
                    </div>
                )}
            </div>
        </div>
    );
};
