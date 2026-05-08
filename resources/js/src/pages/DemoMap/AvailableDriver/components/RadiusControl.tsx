import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '../../../../components/ui/slider';
import { Navigation } from 'lucide-react';

interface RadiusControlProps {
    radius: number;
    onRadiusChange: (value: number) => void;
}

export const RadiusControl = ({ radius, onRadiusChange }: RadiusControlProps) => {
    return (
        <Card className="bg-background/95 backdrop-blur-md shadow-lg border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Navigation className="size-4 text-primary" />
                        <span className="text-sm font-bold">Search Radius</span>
                    </div>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {radius} km
                    </span>
                </div>
                <Slider
                    value={[radius]}
                    onValueChange={(vals) => onRadiusChange(vals[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="py-4"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    <span>1 km</span>
                    <span>20 km</span>
                </div>
            </CardContent>
        </Card>
    );
};
