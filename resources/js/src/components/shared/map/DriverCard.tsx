"use client";

import React from 'react';
import { 
    ShieldCheck, 
    Star, 
    Phone, 
    MessageSquare, 
    Target,
    Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DriverCardProps {
    driver: {
        name: string;
        avatar: string;
        rating: number;
        vehicle: string;
        plate: string;
    };
    status?: "Stable" | "Connecting" | "Lost";
    onFocus?: () => void;
    onCall?: () => void;
    onMessage?: () => void;
    className?: string;
}

export const DriverCard = ({ 
    driver, 
    status = "Stable", 
    onFocus, 
    onCall, 
    onMessage,
    className = "" 
}: DriverCardProps) => {
    return (
        <Card className={`w-[280px] shadow-xl border-white/10 backdrop-blur-md bg-background/70 dark:bg-background/95 overflow-hidden transition-all duration-300 ${className}`}>
            <CardContent className="px-5 py-0">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-primary/5">
                    <div className="relative shrink-0">
                        <div className="size-12 rounded-full overflow-hidden ring-2 ring-primary/10 border border-background shadow-md">
                            <img src={driver.avatar} alt={driver.name} className="size-full object-cover" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-primary border border-background flex items-center justify-center shadow-sm">
                            <ShieldCheck className="size-2.5 text-primary-foreground" />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold tracking-tight truncate leading-tight">{driver.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center text-amber-500">
                                <Star className="size-3 fill-current" />
                                <span className="text-[10px] font-black ml-0.5">{driver.rating}</span>
                            </div>
                            <span className="text-muted-foreground/30 text-[10px]">•</span>
                            <span className="text-[10px] font-bold text-primary/80 uppercase truncate">{driver.vehicle}</span>
                        </div>
                    </div>
                </div>

                {/* Info & Action Row */}
                <div className="flex items-center justify-between py-4">
                    <Badge variant="secondary" className="h-6 px-2 text-[9px] font-black tracking-widest uppercase bg-primary/5 border-primary/10">
                        {driver.plate}
                    </Badge>
                    <div className="flex gap-1.5">
                        <Button size="icon" variant="secondary" className="size-8 rounded-xl" onClick={onCall}>
                            <Phone className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="secondary" className="size-8 rounded-xl" onClick={onMessage}>
                            <MessageSquare className="size-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="space-y-3 pt-4 border-t border-primary/5">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <Activity className="size-3" />
                            <span>Signal</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className={`size-1 rounded-full ${status === "Stable" ? "bg-primary animate-pulse" : "bg-destructive"}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${status === "Stable" ? "text-primary" : "text-destructive"}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-10 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                        onClick={onFocus}
                    >
                        <Target className="size-3.5" />
                        Focus Driver
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
