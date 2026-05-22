import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Package, ClipboardList, ArrowRight } from 'lucide-react';
import { Delivery } from '../../../services/deliveryService';
import { Task } from '../../Tasks/services/taskService';

interface QuickTrackCardsProps {
    loadingRecDeliveries: boolean;
    recentDeliveries: any;
    loadingRecTasks: boolean;
    recentTasks: any;
    handleQuickTrack: (num: string, type: 'delivery' | 'task') => void;
}

export const QuickTrackCards = ({
    loadingRecDeliveries,
    recentDeliveries,
    loadingRecTasks,
    recentTasks,
    handleQuickTrack,
}: QuickTrackCardsProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Quick Tracking Deliveries List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Package className="size-5 text-indigo-500" />
                        Active Deliveries Overview
                    </CardTitle>
                    <CardDescription>
                        Select any active shipment below to launch detailed tracking maps.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loadingRecDeliveries ? (
                        <div className="p-8 flex justify-center">
                            <Spinner className="size-5" />
                        </div>
                    ) : recentDeliveries?.data && recentDeliveries.data.length > 0 ? (
                        recentDeliveries.data.map((d: Delivery) => (
                            <div
                                key={d.id}
                                onClick={() => handleQuickTrack(d.tracking_number, 'delivery')}
                                className="flex items-center justify-between p-3.5 bg-background/50 hover:bg-background border rounded-xl cursor-pointer hover:shadow-sm transition-all duration-300 group"
                            >
                                <div className="space-y-0.5 pr-2">
                                    <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                                        {d.tracking_number}
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground line-clamp-1">
                                        {d.dropoff_address || 'No address set.'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase font-semibold border-muted/80 bg-muted/20"
                                    >
                                        {d.status.replace('_', ' ')}
                                    </Badge>
                                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            No active deliveries recorded.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Tracking Tasks List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <ClipboardList className="size-5 text-emerald-500" />
                        Fleet Tasks Overview
                    </CardTitle>
                    <CardDescription>
                        Select any active operational task to view pickup and destination timelines.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loadingRecTasks ? (
                        <div className="p-8 flex justify-center">
                            <Spinner className="size-5" />
                        </div>
                    ) : recentTasks?.data && recentTasks.data.length > 0 ? (
                        recentTasks.data.map((t: Task) => (
                            <div
                                key={t.id}
                                onClick={() => handleQuickTrack(t.tracking_number, 'task')}
                                className="flex items-center justify-between p-3.5 bg-background/50 hover:bg-background border rounded-xl cursor-pointer hover:shadow-sm transition-all duration-300 group"
                            >
                                <div className="space-y-0.5 pr-2">
                                    <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                                        {t.tracking_number}
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground line-clamp-1">
                                        {t.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase font-semibold border-muted/80 bg-muted/20"
                                    >
                                        {t.status.replace('_', ' ')}
                                    </Badge>
                                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            No active tasks recorded.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
