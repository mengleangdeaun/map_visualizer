import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
    isPending = false,
}: DeleteConfirmModalProps) => {
    const { t } = useTranslation();

    // Prevent closing the dialog while an action is in progress
    const handleOpenChange = (open: boolean) => {
        if (!open && !isPending) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] gap-4 overflow-hidden">
                {/* Visual header with icon - optional, but adds clarity */}
                <div className="flex flex-col items-center text-center pt-6 px-6">
                    <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="size-6 text-destructive" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-tight text-destructive">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-2">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 p-4 sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                        className="sm:min-w-[100px]"
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="sm:min-w-[100px]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                {t('deleting')}...
                            </>
                        ) : (
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