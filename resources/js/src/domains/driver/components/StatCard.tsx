import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    className?: string;
    colorClassName?: string;
}

export const StatCard = ({ 
    label, 
    value, 
    unit, 
    icon: Icon, 
    className,
    colorClassName = "text-muted-foreground"
}: StatCardProps) => {
    return (
        <Card className={cn("p-4 flex flex-col gap-1 shadow-sm border-none bg-card/50 backdrop-blur-sm", className)}>
            <div className={cn("flex items-center justify-between", colorClassName)}>
                <Icon size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black tracking-tight">{value}</span>
                {unit && <span className="text-[10px] font-bold text-muted-foreground uppercase">{unit}</span>}
            </div>
        </Card>
    );
};
