import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { compressImage } from '@/lib/imageService';

interface LogoUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onFileChange?: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  variant?: 'circle' | 'square' | 'rectangle';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  description?: string;
  accept?: string;
}

const LogoUpload = ({
  value,
  onChange,
  onFileChange,
  disabled = false,
  loading: externalLoading = false,
  error,
  required = false,
  className,
  variant = 'square',
  size = 'lg',
  label,
  description,
  accept = 'image/*',
}: LogoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
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
    'relative group overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed transition-all duration-300',
    variant === 'circle' ? 'rounded-full' : 'rounded-xl',
    variant === 'rectangle' ? rectangleSizeClasses[size] : sizeClasses[size],
    !preview && !disabled && 'hover:border-primary hover:bg-primary/5',
    disabled && 'opacity-50 cursor-not-allowed',
    error && !preview && 'border-destructive',
    !error && 'border-border',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    className
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressedUrl = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.7,
        });
        setPreview(compressedUrl);
        onChange?.(compressedUrl);
        onFileChange?.(file);
      } catch (err) {
        console.error('Image compression failed:', err);
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

  const renderPreview = () => {
    if (preview) {
      if (variant === 'circle') {
        return (
          <Avatar className="h-full w-full rounded-none">
            <AvatarImage src={preview} alt="Logo preview" className="object-cover" />
            <AvatarFallback className="bg-muted">Logo</AvatarFallback>
          </Avatar>
        );
      }
      return <img src={preview} alt="Preview" className="h-full w-full object-cover" />;
    }

    return (
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
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </Label>
      )}

      {/* Upload placeholder */}
      <div
        className={containerClasses}
        onClick={handleContainerClick}
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        aria-label={preview ? 'Change logo' : 'Upload logo'}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {renderPreview()}

        {preview && !disabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || loading}
          aria-invalid={!!error}
        />
      </div>

      {/* Description and buttons - now placed below the placeholder */}
      <div className="flex flex-col gap-2 items-start">
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleContainerClick}
            disabled={disabled || loading}
          >
            {preview ? 'Change' : 'Upload'}
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
              <X className="w-4 h-4" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
};

export default LogoUpload;