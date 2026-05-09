"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Navigation2, Clock, MapPin } from 'lucide-react';

interface TelemetryCardProps {
    data: {
        speed: number;
        heading: number;
        timestamp: string;
        latitude: number;
        longitude: number;
    };
}

export const TelemetryCard = ({ data }: TelemetryCardProps) => {
    return (
        <Card>
            <CardHeader >
                <CardTitle className="text-lg">Telemetry Stream</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase mb-1">
                            <Gauge className="size-3" />
                            Speed
                        </div>
                        <div className="text-2xl font-black tracking-tighter">
                            {Math.round(data.speed)} <span className="text-[10px] opacity-50">KM/H</span>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase mb-1">
                            <Navigation2 className="size-3" />
                            Heading
                        </div>
                        <div className="text-2xl font-black tracking-tighter">
                            {Math.round(data.heading)}°
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Clock className="size-3" />
                            Last Update
                        </div>
                        <div className="text-xs font-bold">
                            {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <MapPin className="size-3" />
                            Coordinates
                        </div>
                        <div className="text-[10px] font-bold tracking-tight">
                            {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
