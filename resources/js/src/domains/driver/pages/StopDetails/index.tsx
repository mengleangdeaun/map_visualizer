import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';
import { useHeaderStore } from '../../store/useHeaderStore';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { Skeleton } from '@/components/ui/skeleton';

import { useStopDetails } from './hooks/useStopDetails';
import { StopHeaderCard }     from './components/StopHeaderCard';
import { StopTimelineCard }   from './components/StopTimelineCard';
import { StopItemsCard }      from './components/StopItemsCard';
import { StopCodCard }        from './components/StopCodCard';
import { PodFormCard }        from './components/PodFormCard';
import { StopActionBar }      from './components/StopActionBar';
import { StopExceptionModal } from './components/StopExceptionModal';

const StopDetailsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams({ strict: false }) as { id: string };
    const setHeader = useHeaderStore((s) => s.setHeader);

    const { stop, isLoading, currentTime, arriveMutation, completeMutation, failMutation } =
        useStopDetails(id);

    // Exception modal state
    const [showFailModal, setShowFailModal] = useState(false);
    const [failReason, setFailReason]       = useState('customer_unreachable');
    const [failNotes, setFailNotes]         = useState('');

    // POD form state (lifted here so StopActionBar can trigger submit)
    const [photo, setPhoto]               = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [podNotes, setPodNotes]         = useState('');

    useEffect(() => {
        setHeader({
            title: t('customer_details') || 'Stop Details',
            showBackButton: true,
            backTarget: '/driver/route',
        });
        return () => setHeader({});
    }, [setHeader, t]);

    // ── Loading & not-found guards ────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    if (!stop) {
        return (
            <div className="p-6 text-center text-muted-foreground italic text-sm">
                Stop details not found or completed.
            </div>
        );
    }

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleOpenNavigation = () => {
        const { lat, lng } = stop.delivery;
        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else {
            toast.error('Coordinates not set for this stop');
        }
    };

    const handleMarkDelivered = () => {
        completeMutation.mutate({ photo, notes: podNotes });
    };

    const handleSubmitException = () => {
        failMutation.mutate({ reasonCode: failReason, notes: failNotes });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 flex flex-col gap-4 pb-[160px] relative">
            <StopHeaderCard stop={stop} onOpenNavigation={handleOpenNavigation} />

            <StopTimelineCard stop={stop} currentTime={currentTime} />

            <StopItemsCard stop={stop} />

            <StopCodCard stop={stop} />

            {/* POD form — shown only when driver has arrived */}
            {stop.status === 'arrived' && (
                <PodFormCard
                    photo={photo}
                    photoPreview={photoPreview}
                    notes={podNotes}
                    onPhotoChange={(file, preview) => { setPhoto(file); setPhotoPreview(preview); }}
                    onPhotoRemove={() => { setPhoto(null); setPhotoPreview(null); }}
                    onNotesChange={setPodNotes}
                />
            )}

            <StopActionBar
                stopStatus={stop.status}
                isArrivePending={arriveMutation.isPending}
                isCompletePending={completeMutation.isPending}
                onArrive={() => arriveMutation.mutate()}
                onOpenExceptionModal={() => setShowFailModal(true)}
                onMarkDelivered={handleMarkDelivered}
            />

            <StopExceptionModal
                isOpen={showFailModal}
                isPending={failMutation.isPending}
                reasonCode={failReason}
                notes={failNotes}
                onReasonChange={setFailReason}
                onNotesChange={setFailNotes}
                onClose={() => setShowFailModal(false)}
                onSubmit={handleSubmitException}
            />
            
        </div>
    );
};

export default StopDetailsPage;
