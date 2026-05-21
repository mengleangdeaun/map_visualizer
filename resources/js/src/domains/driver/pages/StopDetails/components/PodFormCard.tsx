import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, Trash2 } from 'lucide-react';

interface PodFormCardProps {
    photo: File | null;
    photoPreview: string | null;
    notes: string;
    onPhotoChange: (file: File, preview: string) => void;
    onPhotoRemove: () => void;
    onNotesChange: (notes: string) => void;
}

export const PodFormCard: React.FC<PodFormCardProps> = ({
    photo,
    photoPreview,
    notes,
    onPhotoChange,
    onPhotoRemove,
    onNotesChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => onPhotoChange(file, reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        onPhotoRemove();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            {/* Photo Capture */}
            <Card className="p-4 border-none shadow-md bg-card space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <Camera size={18} className="text-primary" />
                    <h3 className="font-bold text-base text-foreground">Proof of Delivery</h3>
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
                                onClick={handleRemove}
                                className="absolute top-2 right-2 w-10 h-10 bg-destructive/90 text-destructive-foreground flex items-center justify-center rounded-full shadow-lg active:scale-90"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-border/75 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                        >
                            <Camera size={32} className="opacity-40" />
                            <span className="text-sm font-semibold">Tap to Take Camera Photo</span>
                            <span className="text-[10px] opacity-75">Optional · JPEG / PNG up to 10MB</span>
                        </button>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                    />
                </div>
            </Card>

            {/* Delivery Notes */}
            <Card className="p-4 border-none shadow-md bg-card space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                    Completion Notes (Optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Enter delivery completion notes..."
                    className="w-full h-24 rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none resize-none"
                />
            </Card>
        </>
    );
};
