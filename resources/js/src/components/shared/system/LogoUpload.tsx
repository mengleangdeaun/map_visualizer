import React, { useRef, useState } from 'react';
import { Camera, X, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/imageService';

interface LogoUploadProps {
    value?: string;
    onChange?: (url: string) => void;
    onFileChange?: (file: File) => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    variant?: 'circle' | 'square' | 'rectangle';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    label?: string;
    description?: string;
}

const LogoUpload = ({
    value,
    onChange,
    onFileChange,
    disabled = false,
    loading: externalLoading = false,
    className,
    variant = 'square',
    size = 'lg',
    label,
    description,
}: LogoUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(value || null);
    const [isCompressing, setIsCompressing] = useState(false);

    // Sync preview with incoming value (e.g. when switching companies)
    React.useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const loading = externalLoading || isCompressing;

    const sizeClasses = {
        sm: 'h-16 w-16',
        md: 'h-24 w-24',
        lg: 'h-32 w-32',
        xl: 'h-40 w-40',
    };

    const rectangleSizeClasses = {
        sm: 'h-16 w-24',
        md: 'h-24 w-36',
        lg: 'h-32 w-48',
        xl: 'h-40 w-60',
    };

    const containerClasses = cn(
        'relative group overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed border-border transition-all duration-300',
        variant === 'circle' ? 'rounded-full' : 'rounded-xl',
        variant === 'rectangle' ? rectangleSizeClasses[size] : sizeClasses[size],
        !preview && !disabled && 'hover:border-primary hover:bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setIsCompressing(true);
                const compressedUrl = await compressImage(file, {
                    maxWidth: 400, // Logos don't need to be huge
                    maxHeight: 400,
                    quality: 0.7
                });
                setPreview(compressedUrl);
                onChange?.(compressedUrl);
                onFileChange?.(file);
            } catch (error) {
                console.error('Image compression failed:', error);
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange?.(null as any);
    };

    const handleContainerClick = () => {
        if (!disabled && !loading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {label && <label className="text-sm font-medium text-foreground">{label}</label>}
            
            <div className="flex items-center gap-6">
                <div 
                    className={containerClasses}
                    onClick={handleContainerClick}
                >
                    {preview ? (
                        <>
                            <img 
                                src={preview} 
                                alt="Preview" 
                                className="h-full w-full object-cover"
                            />
                            {!disabled && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                            {loading ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider">{variant}</span>
                                </>
                            )}
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={disabled || loading}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    {description && <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>}
                    <div className="flex gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleContainerClick}
                            disabled={disabled || loading}
                        >
                            {preview ? 'Change Image' : 'Upload'}
                        </Button>
                        {preview && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleRemove}
                                disabled={disabled || loading}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoUpload;
