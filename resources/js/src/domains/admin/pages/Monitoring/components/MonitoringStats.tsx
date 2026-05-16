import React from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, ClipboardList, MapPin, Activity, ShieldAlert, Warehouse, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MonitoringStatsProps {
    vehiclesCount: number;
    activeVehiclesCount: number;
    tasksCount: number;
    hubsCount: number;
    showHubs?: boolean;
    onToggleHubs?: () => void;
    className?: string;
}

export const MonitoringStats = ({
    vehiclesCount,
    activeVehiclesCount,
    tasksCount,
    hubsCount,
    showHubs = false,
    onToggleHubs,
    className
}: MonitoringStatsProps) => {
    const { t } = useTranslation('admin');

    return (
        <div className={cn("flex flex-col gap-2 w-fit", className)}>
                <Card className="bg-background/90 backdrop-blur-sm shadow-lg  p-1 flex flex-row items-center gap-0.5 rounded-xl whitespace-nowrap overflow-hidden">
                {/* Vehicles */}
                <div className="flex items-center gap-2 pl-3 pr-4 border-r border-border/40 py-1">
                    <Truck size={14} className="text-primary" />
                    <div className="flex flex-col -space-y-0.5">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                            {t('vehicles') || 'Vehicles'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black">{activeVehiclesCount}</span>
                            <div className="flex items-center gap-1">
                                <div className="size-1 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks */}
                <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1">
                    <ClipboardList size={14} className="text-blue-500" />
                    <div className="flex flex-col -space-y-0.5">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                            {t('tasks') || 'Tasks'}
                        </span>
                        <span className="text-xs font-black">{tasksCount}</span>
                    </div>
                </div>

                {/* Hubs */}
                <div 
                    className={cn(
                        "flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-muted/50 transition-colors group",
                        !showHubs && "opacity-50 grayscale-[0.5]"
                    )}
                    onClick={onToggleHubs}
                >
                    <Warehouse size={14} className={cn("transition-colors", showHubs ? "text-orange-500" : "text-muted-foreground")} />
                    <div className="flex flex-col -space-y-0.5">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                            {t('hubs') || 'Hubs'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black">{hubsCount}</span>
                            {showHubs ? (
                                <Eye size={10} className="text-orange-500/70" />
                            ) : (
                                <EyeOff size={10} className="text-muted-foreground" />
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex gap-1.5">
                <div className="bg-background/90 backdrop-blur-md border border-primary/5 rounded-full px-2.5 py-0.5 shadow-sm flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground ring-1 ring-black/5">
                    <div className="size-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                    System Optimal
                </div>
                
                {vehiclesCount > activeVehiclesCount && (
                    <div className="bg-background/90 backdrop-blur-md border border-destructive/5 rounded-full px-2.5 py-0.5 shadow-sm flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-destructive ring-1 ring-black/5">
                        <ShieldAlert size={9} />
                        {vehiclesCount - activeVehiclesCount} Offline
                    </div>
                )}
            </div>
        </div>
    );
};
