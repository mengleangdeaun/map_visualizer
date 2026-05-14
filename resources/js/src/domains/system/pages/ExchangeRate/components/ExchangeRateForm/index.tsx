import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { ExchangeRate } from '../../../../services/exchangeRateService';
import { useCreateExchangeRate, useUpdateExchangeRate } from '../../hooks/useExchangeRates';
import { useCompanies } from '../../../../pages/Company/hooks/useCompanies';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { formatForDateTimeLocal, nowForDateTimeLocal } from '@/lib/dateUtils';

const rateSchema = z.object({
    company_id: z.string().min(1, 'field_required'),
    from_currency: z.string().min(3, 'field_required').max(3),
    to_currency: z.string().min(3, 'field_required').max(3),
    rate: z.number().min(0, 'field_required'),
    effective_date: z.string().min(1, 'field_required'),
});

interface ExchangeRateFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exchangeRate?: ExchangeRate;
}

const ExchangeRateForm = ({ open, onOpenChange, exchangeRate }: ExchangeRateFormProps) => {
    const { t } = useTranslation('system');
    
    const { data: companiesData } = useCompanies(1, 100);
    
    const createMutation = useCreateExchangeRate();
    const updateMutation = useUpdateExchangeRate();

    const isEditing = !!exchangeRate;

    const form = useForm({
        defaultValues: {
            company_id: exchangeRate?.company_id || '',
            from_currency: exchangeRate?.from_currency || 'USD',
            to_currency: exchangeRate?.to_currency || 'KHR',
            rate: exchangeRate?.rate || 0,
            effective_date: exchangeRate ? formatForDateTimeLocal(exchangeRate.effective_date) : nowForDateTimeLocal(),
        },
        validators: {
            onChange: rateSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                if (isEditing) {
                    await updateMutation.mutateAsync({ id: exchangeRate.id, data: value });
                } else {
                    await createMutation.mutateAsync(value);
                }
                onOpenChange(false);
            } catch (error) {
                // Handled in mutation hook
            }
        },
    });

    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, exchangeRate]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary">
                        {isEditing ? t('edit_exchange_rate') : t('add_new_exchange_rate')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('manage_currency_conversion_rates')}
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
                        name="company_id"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('company')}</Label>
                                <Select
                                    value={field.state.value}
                                    onValueChange={(val: any) => field.handleChange(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('select_company')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companiesData?.data.map((company) => (
                                            <SelectItem key={company.id} value={company.id}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors.map((error: any) => t(error?.message ?? error)).join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="from_currency"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('from_currency')}</Label>
                                    <Input
                                        id={field.name}
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
                            name="to_currency"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('to_currency')}</Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                                        placeholder="KHR"
                                        maxLength={3}
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <form.Field
                        name="rate"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('rate')}</Label>
                                <Input
                                    id={field.name}
                                    type="number"
                                    step="0.0001"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                    placeholder="0.0000"
                                />
                            </div>
                        )}
                    />

                    <form.Field
                        name="effective_date"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('effective_date')}</Label>
                                <Input
                                    id={field.name}
                                    type="datetime-local"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </div>
                        )}
                    />

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            {t('cancel')}
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button 
                                    type="submit" 
                                    disabled={!canSubmit || isLoading || isSubmitting}
                                >
                                    {(isLoading || isSubmitting) ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    {t('save_exchange_rate')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ExchangeRateForm;
