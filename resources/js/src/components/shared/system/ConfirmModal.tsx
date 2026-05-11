import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isPending?: boolean;
    variant?: 'primary' | 'destructive' | 'warning';
    icon?: LucideIcon;
}

export const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    description,
    confirmText,
    cancelText,
    isPending,
    variant = 'primary',
    icon: Icon = HelpCircle
}: ConfirmModalProps) => {
    const { t } = useTranslation();

    const variantStyles = {
        primary: {
            bg: 'bg-primary/10',
            icon: 'text-primary',
            border: 'border-primary/20',
            button: 'bg-primary hover:bg-primary/90'
        },
        destructive: {
            bg: 'bg-destructive/10',
            icon: 'text-destructive',
            border: 'border-destructive/20',
            button: 'bg-destructive hover:bg-destructive/90'
        },
        warning: {
            bg: 'bg-amber-500/10',
            icon: 'text-amber-500',
            border: 'border-amber-500/20',
            button: 'bg-amber-500 hover:bg-amber-600'
        }
    };

    const styles = variantStyles[variant];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(
                "sm:max-w-[400px] bg-card/95 backdrop-blur-xl shadow-2xl border",
                styles.border
            )}>
                <DialogHeader className="items-center text-center">
                    <div className={cn("size-12 rounded-full flex items-center justify-center mb-4", styles.bg)}>
                        <Icon className={cn("size-6", styles.icon)} />
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter className="flex gap-2 pt-4 sm:justify-end">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {cancelText || t('cancel')}
                    </Button>
                    <Button 
                        type="button" 
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isPending}
                        className={styles.button}
                    >
                        {isPending ? t('processing') + '...' : (confirmText || t('confirm'))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
