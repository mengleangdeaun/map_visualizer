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
import { Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isPending?: boolean;
}

export const DeleteConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    description,
    isPending 
}: DeleteConfirmModalProps) => {
    const { t } = useTranslation();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-destructive/20 shadow-2xl">
                <DialogHeader className="items-center text-center">
                    <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 border border-destructive/20">
                        <AlertTriangle className="size-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-red-500">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter className="flex gap-2 pt-4 sm:justify-end">
                    <Button 
                        size="lg"
                        type="button" 
                        variant="ghost" 
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t('cancel')}
                    </Button>
                    <Button 
                        size="lg"
                        type="button" 
                        variant="destructive" 
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? t('deleting') + '...' : (
                            <>
                                <Trash2 className="mr-2 size-4" />
                                {t('delete')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
