import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderStore } from '../../store/useHeaderStore';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { useLocationStore } from '../../store/useLocationStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Camera, 
    CheckCircle2, 
    DollarSign,
    Loader2,
    Trash2,
    Plus
} from 'lucide-react';
import api from '@/lib/api';

const PODFormPage = () => {
    const { t } = useTranslation(['delivery', 'driver']);
    const { id } = useParams({ strict: false });
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const setHeader = useHeaderStore(s => s.setHeader);

    const [notes, setNotes] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHeader({ 
            title: t('delivery:complete_stop') || 'Resolve Success',
            showBackButton: true,
            backTarget: `/driver/route/stop/${id}`
        });
        return () => setHeader({});
    }, [setHeader, id, t]);

    // Query active route to find the stop details
    const { data: routeData, isLoading } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        }
    });

    const stop = routeData?.stops?.find((s: any) => s.id === id);

    // Mutation to submit successfully completed stop
    const completeMutation = useMutation({
        mutationFn: async () => {
            const { latitude, longitude } = useLocationStore.getState();
            const formData = new FormData();
            formData.append('notes', notes);
            if (photo) {
                formData.append('photo', photo);
            }
            if (latitude !== null) formData.append('latitude', latitude.toString());
            if (longitude !== null) formData.append('longitude', longitude.toString());

            const { data } = await api.post(`/driver/route/stops/${id}/complete`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Stop resolved successfully as delivered!");
            
            // Native vibration
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }

            // Redirect back to active route list
            navigate({ to: '/driver/route' });
            
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to submit resolution");
        }
    });

    // Handle photo capture selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);

            // Generate temporary URL for UI rendering
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
        );
    }

    if (!stop) {
        return (
            <div className="p-6 text-center text-muted-foreground italic text-sm">
                Stop details not found.
            </div>
        );
    }

    const dl = stop.delivery;

    return (
        <div className="p-4 flex flex-col gap-4 pb-24">
            {/* 1. Expected Cash Collection summary */}
            <Card className="p-4 border-none shadow-md bg-emerald-500/10 text-emerald-700 flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold uppercase block">{t('delivery:cod_due')}</span>
                    <span className="text-xs font-semibold uppercase opacity-85 block">
                        Payment: {dl.order.payment_method}
                    </span>
                </div>
                <div className="flex items-center font-black text-2xl">
                    <DollarSign size={20} />
                    <span>{dl.order.amount_due_cod.toFixed(2)}</span>
                </div>
            </Card>

            {/* 2. Photo Upload / Camera Capture (Touch size >44px) */}
            <Card className="p-4 border-none shadow-md bg-card space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <Camera size={18} className="text-primary" />
                    <h3 className="font-bold text-base text-foreground">
                        {t('delivery:upload_photo')}
                    </h3>
                </div>

                <div className="flex flex-col items-center justify-center">
                    {photoPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border border-border max-w-sm w-full">
                            <img 
                                src={photoPreview} 
                                alt="Proof of delivery" 
                                className="w-full h-48 object-cover"
                            />
                            <button
                                onClick={handleRemovePhoto}
                                className="absolute top-2 right-2 w-10 h-10 bg-destructive/90 text-destructive-foreground flex items-center justify-center rounded-full shadow-lg active:scale-90"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-border/75 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                            style={{ minHeight: '160px' }}
                        >
                            <Camera size={32} className="opacity-40" />
                            <span className="text-sm font-semibold">Tap to Take Camera Photo</span>
                            <span className="text-[10px] opacity-75">Supports JPEG / PNG up to 10MB</span>
                        </button>
                    )}

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment" // Forces back-camera on mobile devices
                        className="hidden"
                    />
                </div>
            </Card>

            {/* 3. Resolution Comments Notes */}
            <Card className="p-4 border-none shadow-md bg-card space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                    {t('delivery:notes')}
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter delivery completion notes (optional)..."
                    className="w-full h-24 rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none resize-none"
                />
            </Card>

            {/* 4. Submission Button (Minimum 44px) */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border/50 p-4 z-10 max-w-md mx-auto">
                <Button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:opacity-70"
                >
                    {completeMutation.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <CheckCircle2 size={18} />
                    )}
                    <span>{t('delivery:submit_success')}</span>
                </Button>
            </div>
        </div>
    );
};

export default PODFormPage;
