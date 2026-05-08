import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '../../../../components/ui/slider';
import { Navigation, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadiusControlProps {
    radius: number;
    onRadiusChange: (value: number) => void;
}

export const RadiusControl = ({ radius, onRadiusChange }: RadiusControlProps) => {
    return (
        <Card className="bg-background/90 backdrop-blur-xl shadow-2xl border border-primary/10 overflow-hidden group">
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Radar className="size-4 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 leading-none">Scanning</span>
                            <span className="text-sm font-bold">Search Area</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-primary tabular-nums">
                            {radius}
                            <span className="text-[10px] ml-1 font-bold text-muted-foreground uppercase tracking-tight">km</span>
                        </span>
                    </div>
                </div>

                <div className="relative px-1">
                    <Slider
                        value={[radius]}
                        onValueChange={(vals) => onRadiusChange(vals[0])}
                        min={1}
                        max={20}
                        step={1}
                    />
                </div>

                <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] px-1">
                    <div className="flex flex-col items-start">
                        <span className="h-1.5 w-px bg-muted-foreground/30 mb-1 ml-1" />
                        <span>1 km</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="h-1.5 w-px bg-muted-foreground/30 mb-1 mr-1" />
                        <span>20 km</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
