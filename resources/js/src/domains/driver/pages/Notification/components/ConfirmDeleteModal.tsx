import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
}) => {
    const { t } = useTranslation();

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 mt-4 text-center">
                <div className="mx-auto size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertTriangle size={22} strokeWidth={2.5} />
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-black tracking-tight text-foreground">
                        {t('delete_all') || 'Delete all notifications?'}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                        {t('delete_all_warning') || 'Are you sure you want to delete all notifications? This action cannot be undone.'}
                    </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    <Button
                        variant="destructive"
                        className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-11"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? t('deleting') || 'Deleting...' : t('delete') || 'Delete'}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-11 text-muted-foreground"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        {t('cancel') || 'Cancel'}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default ConfirmDeleteModal;
