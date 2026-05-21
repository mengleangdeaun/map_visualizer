import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface StopActionBarProps {
    stopStatus: string;
    isArrivePending: boolean;
    isCompletePending: boolean;
    onArrive: () => void;
    onOpenExceptionModal: () => void;
    onMarkDelivered: () => void;
}

export const StopActionBar: React.FC<StopActionBarProps> = ({
    stopStatus,
    isArrivePending,
    isCompletePending,
    onArrive,
    onOpenExceptionModal,
    onMarkDelivered,
}) => {
    const isPendingOrTransit = stopStatus === 'pending' || stopStatus === 'in_transit';
    const isArrived = stopStatus === 'arrived';

    if (!isPendingOrTransit && !isArrived) return null;

    return (
        <div className="fixed bottom-[72px] left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border/50 p-4 z-40 flex gap-3 max-w-md mx-auto">
            {isPendingOrTransit && (
                <Button
                    onClick={onArrive}
                    disabled={isArrivePending}
                    className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                    {isArrivePending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Navigation size={18} />
                    )}
                    {isArrivePending ? 'Confirming Arrival...' : 'Confirm Arrival at Stop'}
                </Button>
            )}

            {isArrived && (
                <>
                    <Button
                        onClick={onOpenExceptionModal}
                        variant="destructive"
                        className="w-[120px] h-11 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        <AlertTriangle size={16} />
                        Exception
                    </Button>

                    <Button
                        onClick={onMarkDelivered}
                        disabled={isCompletePending}
                        className="flex-1 h-11 rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-70"
                    >
                        {isCompletePending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={18} />
                        )}
                        {isCompletePending ? 'Submitting...' : 'Mark as Delivered'}
                    </Button>
                </>
            )}
        </div>
    );
};
