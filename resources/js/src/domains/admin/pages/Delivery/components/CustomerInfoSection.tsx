import React from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { User as UserIcon, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

interface CustomerInfoSectionProps {
    form: any;
    customersData: { data: any[] } | undefined;
}

/**
 * Presentational section for Customer, Order Date, and Payment Method fields.
 * Part of the left column inside DeliveryDialog.
 */
const CustomerInfoSection = ({ form, customersData }: CustomerInfoSectionProps) => {
    const { t } = useTranslation(['admin']);

    return (
        <div className="bg-card p-4 rounded-xl border shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <UserIcon className="size-4 text-primary" />
                {t('admin:customer_information') || 'Customer Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer */}
                <form.Field
                    name="customer_id"
                    validators={{ onChange: z.string().min(1, 'Customer is required') }}
                    children={(field: any) => (
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <Label htmlFor={field.name} className="text-xs font-semibold">
                                {t('admin:select_customer') || 'Customer'}
                            </Label>
                            <SearchableSelect
                                options={customersData?.data || []}
                                value={field.state.value}
                                onChange={(val: string) => field.handleChange(val || '')}
                                placeholder={t('admin:select_customer') || 'Select Customer'}
                                searchPlaceholder={t('admin:search_customer') || 'Search customer...'}
                                getOptionValue={(c: any) => c.id}
                                getOptionLabel={(c: any) => `${c.name} (${c.phone})`}
                                getOptionSearchTerms={(c: any) => [c.name, c.phone]}
                                renderOption={(c: any) => (
                                    <div className="flex flex-col py-0.5">
                                        <span className="font-semibold text-xs text-foreground">{c.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{c.phone}</span>
                                    </div>
                                )}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="text-[10px] text-destructive">
                                    {field.state.meta.errors
                                        .map((err: any) => (typeof err === 'object' ? err?.message : err))
                                        .join(', ')}
                                </p>
                            )}
                        </div>
                    )}
                />

                {/* Order Date */}
                <form.Field
                    name="order_date"
                    children={(field: any) => (
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <Label htmlFor={field.name} className="text-xs font-semibold flex items-center gap-1">
                                <CalendarDays className="size-3 text-muted-foreground" />
                                {t('admin:order_date') || 'Order Date'}
                            </Label>
                            <Input
                                type="datetime-local"
                                id={field.name}
                                className="h-10 text-xs bg-background"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                        </div>
                    )}
                />

                {/* Payment Method */}
                <form.Field
                    name="payment_method"
                    children={(field: any) => (
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <Label htmlFor={field.name} className="text-xs font-semibold">
                                {t('admin:payment_method') || 'Payment Method'}
                            </Label>
                            <Select
                                value={field.state.value}
                                onValueChange={(val) => field.handleChange(val as any)}
                            >
                                <SelectTrigger className="!h-10">
                                    <SelectValue placeholder={t('admin:payment_method')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">{t('admin:cash') || 'Cash (COD)'}</SelectItem>
                                    <SelectItem value="khqr">{t('admin:khqr') || 'KHQR (Scan)'}</SelectItem>
                                    <SelectItem value="postpaid">{t('admin:postpaid') || 'Postpaid'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default CustomerInfoSection;
