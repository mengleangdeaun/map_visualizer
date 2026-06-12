import React from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';

interface RouteEmptyStateProps {
    onRefresh: () => Promise<void>;
    onOpenMap: () => void;
}

export const RouteEmptyState: React.FC<RouteEmptyStateProps> = ({ onRefresh, onOpenMap }) => {
    const { t } = useTranslation();

    return (
        <PullToRefresh onRefresh={onRefresh}>
            <div className="px-4 py-3 flex flex-col gap-4 max-w-md mx-auto animate-in fade-in duration-500 pb-24 h-[calc(100vh-140px)] select-none">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-full flex flex-col items-center justify-center p-8 bg-card/20 border border-dashed border-border/80 rounded-2xl shadow-none animate-in fade-in duration-300">
                        <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground/60">
                            <Route size={22} />
                        </div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight mb-1 text-center">
                            {t('no_active_route') || 'No Active Route'}
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-[210px] leading-relaxed text-center mb-6">
                            {t('no_active_route_desc') || 'No active deliveries or route assigned for you today.'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-black text-[10px] h-9 px-4 uppercase tracking-wider text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40 transition-colors active:scale-[0.98]"
                            onClick={onOpenMap}
                        >
                            <Map size={14} className="mr-1.5" />
                            {t('open_map') || 'Open Live Map'}
                        </Button>
                    </div>
                </div>
            </div>
        </PullToRefresh>
    );
};