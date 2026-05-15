import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationService } from '../../hooks/useLocationService';
import { StatCard } from '../../components/StatCard';
import { ShiftControl } from '../../components/ShiftControl';
import { Card } from '@/components/ui/card';
import { Navigation, AlertCircle, Signal, Map as MapIcon, Activity, Truck, ChevronRight } from 'lucide-react';
import { useDriverTasks } from '../../hooks/useDriverTasks';
import { Link } from '@tanstack/react-router';

const DriverDashboard = () => {
    const { t } = useTranslation(['driver', 'system']);
    const { isTracking, startTracking, stopTracking, latitude, longitude, error, speed } = useLocationService();
    const { data: tasksData } = useDriverTasks();
    const tasks = tasksData?.data || [];
    const activeTask = tasks.find(t => t.status === 'in_progress');

    const toggleShift = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };

    return (
        <div className="p-4 flex flex-col gap-6 max-w-md mx-auto animate-in fade-in duration-500">
            {/* Main Shift Control */}
            <ShiftControl isOnline={isTracking} onToggle={toggleShift} />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    label="Active Task" 
                    value={activeTask ? '1' : 'None'} 
                    icon={Activity} 
                    colorClassName={activeTask ? "text-primary" : "text-muted-foreground"}
                />
                <StatCard 
                    label="Speed" 
                    value={speed ? Math.round(speed * 3.6) : 0} 
                    unit="km/h"
                    icon={Navigation} 
                    colorClassName="text-blue-500"
                />
            </div>

            {/* Tasks Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Upcoming Deliveries</span>
                    <Link to="/driver/tasks" className="text-[10px] font-bold text-primary hover:underline uppercase">View All</Link>
                </div>
                
                {tasks.length === 0 ? (
                    <Card className="p-4 bg-background/50 border-dashed border-2 flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                        <MapIcon size={32} className="opacity-20" />
                        <span className="text-xs font-medium italic">No active tasks assigned yet.</span>
                    </Card>
                ) : (
                    <Link to="/driver/tasks">
                        <Card className="p-4 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <Truck size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black tracking-tight">{tasks[0].title}</span>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{tasks[0].status} • {tasks[0].customer?.name}</span>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </Card>
                    </Link>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Debug Coordinates */}
            {latitude && longitude && (
                <div className="mt-auto text-center opacity-30">
                    <span className="text-[9px] font-mono">
                        GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default DriverDashboard;
