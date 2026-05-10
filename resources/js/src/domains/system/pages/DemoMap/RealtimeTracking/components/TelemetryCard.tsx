"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Gauge, 
    Navigation, 
    Clock, 
    MapPin, 
    Activity 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface TelemetryCardProps {
    data: {
        speed: number;
        heading: number;
        timestamp: string;
        latitude: number;
        longitude: number;
    } | null;
    isConnected: boolean;
    historyLength: number;
}

export const TelemetryCard = ({ data, isConnected, historyLength }: TelemetryCardProps) => {
    return (
        <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold uppercase">
                        Stream Monitor
                    </CardTitle>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                        {isConnected ? 'LIVE' : 'DISCONNECTED'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full px-6">
                    <div className="space-y-6 pb-8">
                        {/* Speed Gauge - Non-Shadcn container */}
                        <div className="p-6 rounded-2xl bg-primary text-primary-foreground relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Vehicle Velocity</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black">{data ? Math.round(data.speed) : '0'}</span>
                                    <span className="text-sm font-bold opacity-80">KM/H</span>
                                </div>
                            </div>
                            <Gauge className="absolute top-1/2 right-4 -translate-y-1/2 size-16 opacity-10" />
                        </div>

                        {/* Telemetry Grid */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Navigation className="size-4 text-primary" style={{ transform: `rotate(${data?.heading ?? 0}deg)` }} />
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Heading</div>
                                        <div className="text-sm font-bold">{data ? Math.round(data.heading) : '0'}°</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <MapPin className="size-4 text-primary" />
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Coordinates</div>
                                        <div className="text-xs font-medium font-mono">
                                            {data ? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}` : '0.0000, 0.0000'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Clock className="size-4 text-primary" />
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Last Sync</div>
                                        <div className="text-xs font-bold">
                                            {data ? new Date(data.timestamp).toLocaleTimeString() : '--:--:--'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connection Status Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link Stability</span>
                                <span className="text-[10px] font-bold text-primary">{isConnected ? '98%' : '0%'}</span>
                            </div>
                            <Progress value={isConnected ? 98 : 0} />
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="p-3 rounded-lg bg-muted border text-center">
                                    <div className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Latency</div>
                                    <div className="text-xs font-bold">{isConnected ? '24ms' : '--'}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted border text-center">
                                    <div className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Buffer</div>
                                    <div className="text-xs font-bold">{historyLength}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl border bg-muted/50 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2">
                                <Activity className="size-3 text-primary" />
                                <span className="font-bold uppercase">System Status</span>
                            </div>
                            <span className="font-bold text-primary uppercase">Operational</span>
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
