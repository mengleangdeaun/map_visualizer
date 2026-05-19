import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TruckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Route } from '../../../services/routeService';

export const routeStatusColors: Record<string, string> = {
    draft:       'bg-muted text-muted-foreground border border-border',
    optimized:   'bg-primary/15 text-primary border border-primary/20',
    in_progress: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
    completed:   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    cancelled:   'bg-destructive/10 text-destructive border border-destructive/20',
};

interface RouteListProps {
    routes: Route[];
    total: number;
    selectedRouteId: string | null;
    onSelectRoute: (id: string) => void;
    onCreateRoute: (data: { date: string; notes?: string }) => void;
    isCreating: boolean;
}

export const RouteList: React.FC<RouteListProps> = ({
    routes,
    total,
    selectedRouteId,
    onSelectRoute,
    onCreateRoute,
    isCreating,
}) => {
    const [showForm, setShowForm] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');

    const handleCreate = () => {
        onCreateRoute({ date, notes: notes || undefined });
        setShowForm(false);
        setNotes('');
    };

    // Timezone-safe date formatter that handles both raw ISO strings and date parts correctly
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        try {
            const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const [year, month, day] = cleanStr.split('-');
            if (!year || !month || !day) return dateStr;
            
            const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
            return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="w-full flex flex-col min-h-0 bg-muted/10 h-full">
            <div className="p-3 border-b border-border/40 flex items-center justify-between bg-background/50">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Routes ({total})
                </span>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="text-[10px] font-bold text-primary hover:underline"
                >
                    {showForm ? 'Cancel' : '+ New'}
                </button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-1.5">

                    {/* Inline creation form */}
                    {showForm && (
                        <div className="p-3 rounded-xl border border-border bg-card shadow-sm space-y-3">
                            <span className="text-xs font-black text-primary uppercase">New Route</span>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Date</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-xs font-semibold"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Notes (optional)</Label>
                                <Textarea
                                    className="min-h-[48px] text-xs resize-none"
                                    placeholder="Morning shift..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1 h-7 text-xs font-bold" onClick={handleCreate} disabled={isCreating}>
                                    Create
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Route cards */}
                    {routes.map(route => (
                        <div
                            key={route.id}
                            className={cn(
                                'p-3 rounded-xl border cursor-pointer transition-all duration-200 shadow-xs',
                                selectedRouteId === route.id
                                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                                    : 'bg-gradient-to-t from-card to-background border-border'
                            )}
                            onClick={() => onSelectRoute(route.id)}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-foreground">
                                    {formatDate(route.date)}
                                </span>
                                <span className={cn('text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full', routeStatusColors[route.status])}>
                                    {route.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <TruckIcon className="size-3 text-muted-foreground/80" />
                                <span className="truncate font-semibold">{route.driver?.name ?? 'No driver'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold font-mono text-muted-foreground">
                                <span>{route.stop_count} stops</span>
                                <span>·</span>
                                <span>{route.total_weight_kg} kg</span>
                                {route.estimated_distance_km && (
                                    <>
                                        <span>·</span>
                                        <span>{route.estimated_distance_km} km</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                </div>
            </ScrollArea>
        </div>
    );
};
