import React from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../../services/companyService';
import { toast } from 'sonner';

interface AddCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const companySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    tax_id: z.string(),
    base_currency: z.string().length(3),
    telegram_user_id: z.string(),
});

const AddCompanyModal = ({ isOpen, onClose }: AddCompanyModalProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: companyService.createCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('company_created_successfully'));
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('error_creating_company'));
        }
    });

    const form = useForm({
        defaultValues: {
            name: '',
            tax_id: '',
            base_currency: 'USD',
            telegram_user_id: '',
        },
        validators: {
            onChange: companySchema,
        },
        onSubmit: async ({ value }) => {
            mutation.mutate(value);
        },
    });

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-card backdrop-blur-lg border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary">{t('add_new_company')}</DialogTitle>
                    <DialogDescription>
                        {t('enter_the_details_of_the_new_organization')}
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
                                    value={field.state.value}
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
                                        value={field.state.value}
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
                                <Button type="submit" size="lg" disabled={!canSubmit || mutation.isPending}>
                                    {mutation.isPending || isSubmitting ? t('saving') + '...' : t('save_company')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddCompanyModal;
