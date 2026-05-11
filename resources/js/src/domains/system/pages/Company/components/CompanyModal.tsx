import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useCreateCompany, useUpdateCompany } from '../hooks/useCompanies';
import { Company } from '../../../services/companyService';

interface CompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Company | null;
}

const companySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    tax_id: z.string(),
    base_currency: z.string().length(3),
    telegram_user_id: z.string(),
});

const CompanyModal = ({ isOpen, onClose, initialData }: CompanyModalProps) => {
    const { t } = useTranslation();
    const createMutation = useCreateCompany();
    const updateMutation = useUpdateCompany();

    const isEditing = !!initialData;

    const form = useForm({
        defaultValues: {
            name: initialData?.name || '',
            tax_id: initialData?.tax_id || '',
            base_currency: initialData?.base_currency || 'USD',
            telegram_user_id: initialData?.telegram_user_id || '',
        },
        validators: {
            onChange: companySchema,
        },
        onSubmit: async ({ value }) => {
            if (isEditing && initialData) {
                updateMutation.mutate({ id: initialData.id, data: value }, {
                    onSuccess: () => onClose()
                });
            } else {
                createMutation.mutate(value, {
                    onSuccess: () => onClose()
                });
            }
        },
    });

    // Reset form when initialData changes or modal opens
    useEffect(() => {
        if (isOpen) {
            form.reset();
        }
    }, [isOpen, initialData]);

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary">
                        {isEditing ? t('edit_company') : t('add_new_company')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing 
                            ? t('update_the_details_of_the_organization') 
                            : t('enter_the_details_of_the_new_organization')}
                    </DialogDescription>
                </DialogHeader>
                
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }} 
                    className="space-y-4 pt-4"
                >
                    <form.Field
                        name="name"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label>{t('company_name')}</Label>
                                <Input 
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('enter_company_name')}
                                />
                                {field.state.meta.errors ? (
                                    <span className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</span>
                                ) : null}
                            </div>
                        )}
                    />

                    <form.Field
                        name="tax_id"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label>{t('tax_id')}</Label>
                                <Input 
                                    name={field.name}
                                    value={field.state.value ?? ''}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('enter_tax_id')}
                                />
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="base_currency"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('base_currency')}</Label>
                                    <Input 
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                                        placeholder="USD"
                                        maxLength={3}
                                    />
                                </div>
                            )}
                        />
                        <form.Field
                            name="telegram_user_id"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('telegram_id')}</Label>
                                    <Input 
                                        name={field.name}
                                        value={field.state.value ?? ''}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="@username"
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" size="lg" variant="ghost" onClick={handleClose}>
                            {t('cancel')}
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button 
                                    type="submit" 
                                    size="lg" 
                                    disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending || isSubmitting) 
                                        ? t('saving') + '...' 
                                        : t('save_company')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CompanyModal;
