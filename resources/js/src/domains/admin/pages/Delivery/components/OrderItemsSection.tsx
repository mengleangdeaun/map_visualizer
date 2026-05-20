import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, DollarSign, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FormItem {
    product_name: string;
    quantity: number;
    unit_price: number;
}

interface OrderItemsSectionProps {
    form: any;
    formValues: any;
}

/**
 * Presentational section for the order items table, financial adjustments,
 * and the live invoice breakdown summary card.
 * Rule-compliant: uses semantic color tokens only (text-success, text-warning,
 * text-destructive). No hardcoded color classes.
 */
const OrderItemsSection = ({ form, formValues }: OrderItemsSectionProps) => {
    const { t } = useTranslation(['admin']);
    const formItems: FormItem[] = formValues.items || [];

    return (
        <div className="bg-card p-4 rounded-xl border shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ClipboardList className="size-4 text-primary" />
                    {t('admin:order_items') || 'Order Items'}
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        form.setFieldValue('items', [
                            ...form.getFieldValue('items'),
                            { product_name: '', quantity: 1, unit_price: 0 },
                        ]);
                    }}
                    className="h-7 text-xs gap-1 border-primary/20 hover:bg-primary/5 text-primary"
                >
                    <Plus className="size-3" />
                    {t('admin:add_item') || 'Add Item'}
                </Button>
            </div>

            {/* Items list */}
            <div className="space-y-3">
                {formItems.map((item: FormItem, idx: number) => (
                    <div
                        key={idx}
                        className="grid grid-cols-12 gap-3 items-end bg-muted/10 p-3 rounded-lg border"
                    >
                        <div className="col-span-6 space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('admin:product_name') || 'Product Name'}
                            </Label>
                            <Input
                                placeholder="Product A"
                                className="h-8 text-xs bg-background"
                                value={item.product_name}
                                onChange={(e) => {
                                    const updated = [...formItems];
                                    updated[idx] = { ...updated[idx], product_name: e.target.value };
                                    form.setFieldValue('items', updated);
                                }}
                                required
                            />
                        </div>

                        <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('admin:qty') || 'Qty'}
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                className="h-8 text-xs bg-background"
                                value={item.quantity}
                                onChange={(e) => {
                                    const updated = [...formItems];
                                    updated[idx] = { ...updated[idx], quantity: Math.max(1, Number(e.target.value)) };
                                    form.setFieldValue('items', updated);
                                }}
                                required
                            />
                        </div>

                        <div className="col-span-3 space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('admin:price') || 'Price'}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-8 text-xs bg-background"
                                value={item.unit_price}
                                onChange={(e) => {
                                    const updated = [...formItems];
                                    updated[idx] = { ...updated[idx], unit_price: Math.max(0, Number(e.target.value)) };
                                    form.setFieldValue('items', updated);
                                }}
                                required
                            />
                        </div>

                        <div className="col-span-1 flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:bg-destructive/10"
                                disabled={formItems.length === 1}
                                onClick={() => {
                                    const updated = formItems.filter((_: FormItem, i: number) => i !== idx);
                                    form.setFieldValue('items', updated);
                                }}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">

                {/* Column 1: Adjustments */}
                <div className="space-y-4 pr-0 md:pr-4 md:border-r border-border/60">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('admin:financial_adjustments') || 'Financial Adjustments'}
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Currency */}
                        <form.Field
                            name="currency_code"
                            children={(field: any) => (
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        {t('admin:currency') || 'Currency'}
                                    </Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(val) => field.handleChange(val as any)}
                                    >
                                        <SelectTrigger className="h-9 text-xs font-semibold bg-background">
                                            <SelectValue placeholder="USD" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="KHR">KHR (៛)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />

                        {/* Exchange Rate */}
                        <form.Field
                            name="exchange_rate"
                            children={(field: any) => (
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        {t('admin:exchange_rate') || 'Exchange Rate (USD to KHR)'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="1"
                                            className="h-9 text-xs bg-background pr-10 font-mono font-semibold"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground font-mono">
                                            ៛/USD
                                        </span>
                                    </div>
                                </div>
                            )}
                        />

                        {/* Discount Type */}
                        <form.Field
                            name="discount_type"
                            children={(field: any) => (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        {t('admin:discount_type') || 'Discount Type'}
                                    </Label>
                                    <Select
                                        value={field.state.value || 'none'}
                                        onValueChange={(val) =>
                                            field.handleChange(val === 'none' ? '' : (val as any))
                                        }
                                    >
                                        <SelectTrigger className="!h-9 text-xs bg-background">
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('admin:none', 'None')}</SelectItem>
                                            <SelectItem value="percentage">
                                                {t('admin:percentage', 'Percentage (%)')}
                                            </SelectItem>
                                            <SelectItem value="fixed">
                                                {t('admin:fixed_amount', 'Fixed Amount ($)')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />

                        {/* Discount Value */}
                        <form.Field
                            name="discount_value"
                            children={(field: any) => (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        {t('admin:discount_value') || 'Discount Value'}
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        disabled={!formValues.discount_type}
                                        className="h-9 text-xs bg-background"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </div>
                            )}
                        />

                        {/* Tax % */}
                        <form.Field
                            name="tax_percent"
                            children={(field: any) => (
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        {t('admin:tax_percent') || 'Tax (%)'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            className="h-9 text-xs bg-background pr-8"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                            %
                                        </span>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Column 2: Invoice Breakdown */}
                <div className="space-y-3.5 flex flex-col justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('admin:invoice_summary') || 'Invoice Breakdown'}
                    </h4>

                    <div className="space-y-2 text-xs font-semibold bg-background p-3.5 rounded-lg border border-border/80 shadow-2xs">

                        {/* Subtotal */}
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span>{t('admin:subtotal') || 'Subtotal'}:</span>
                            <div className="flex flex-col items-end">
                                <span className="font-mono text-foreground font-semibold">
                                    ${Number(formValues.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    ៛{Number(formValues.subtotal_khr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>

                        {/* Discount */}
                        {Number(formValues.discount_total) > 0 && (
                            <div className="flex justify-between items-center text-destructive">
                                <span>
                                    {t('admin:discount') || 'Discount'}{' '}
                                    ({formValues.discount_type === 'percentage' ? `${formValues.discount_value}%` : 'Fixed'}):
                                </span>
                                <span className="font-mono font-semibold">
                                    -${Number(formValues.discount_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {/* Taxable Amount */}
                        {Number(formValues.discount_total) > 0 && (
                            <div className="flex justify-between items-center text-muted-foreground/80 border-t pt-1.5">
                                <span>{t('admin:taxable_subtotal') || 'Taxable Amount'}:</span>
                                <span className="font-mono text-foreground font-semibold">
                                    ${Number(formValues.taxable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {/* Tax Total */}
                        {Number(formValues.tax_percent) > 0 && (
                            <div className="flex justify-between items-center text-warning">
                                <span>{t('admin:tax') || 'Tax'} ({formValues.tax_percent}%):</span>
                                <span className="font-mono font-semibold">
                                    +${Number(formValues.tax_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between items-center text-sm font-semibold border-t border-dashed pt-2 text-primary">
                            <span>{t('admin:grand_total') || 'Grand Total'}:</span>
                            <div className="flex flex-col items-end">
                                <span className="font-mono">
                                    ${Number(formValues.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-primary/80 font-mono">
                                    ៛{Number(formValues.grand_total_khr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>

                        {/* Paid Amount */}
                        <div className="flex justify-between items-center text-muted-foreground/80 border-t pt-1.5">
                            <span>{t('admin:paid_amount') || 'Paid Amount'}</span>
                            <span className="font-mono text-success font-semibold">
                                ${Number(formValues.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Balance Amount */}
                        <div className="flex justify-between items-center text-muted-foreground/80">
                            <span>{t('admin:balance_amount') || 'Balance Amount'}:</span>
                            <span className="font-mono text-destructive font-semibold">
                                ${Number(formValues.balance_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Payment Status Badge */}
                        <div className="flex justify-between items-center pt-1">
                            <span>{t('admin:payment_status') || 'Payment Status'}:</span>
                            <Badge
                                variant="outline"
                                className={
                                    formValues.payment_status === 'paid'
                                        ? 'border-success/30 bg-success/10 text-success text-[10px] uppercase font-semibold'
                                        : formValues.payment_status === 'partially_paid'
                                        ? 'border-warning/30 bg-warning/10 text-warning text-[10px] uppercase font-semibold'
                                        : 'border-destructive/30 bg-destructive/10 text-destructive text-[10px] uppercase font-semibold'
                                }
                            >
                                {formValues.payment_status === 'paid'
                                    ? t('admin:paid') || 'Paid'
                                    : formValues.payment_status === 'partially_paid'
                                    ? t('admin:partially_paid') || 'Partially Paid'
                                    : t('admin:unpaid') || 'Unpaid'}
                            </Badge>
                        </div>
                    </div>

                    {/* Paid Amount & COD inputs */}
                    <div className="grid grid-cols-2 gap-3">
                        <form.Field
                            name="paid_amount"
                            children={(field: any) => (
                                <div className="space-y-1.5 bg-success/5 p-2 px-3 rounded-lg border border-success/20">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-semibold text-success uppercase tracking-wider">
                                            {t('admin:paid_amount') || 'Amount Paid'}
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="h-8 pl-8 text-xs font-mono font-semibold text-foreground bg-background border-success/20"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}
                        />

                        <form.Field
                            name="amount_due_cod"
                            children={(field: any) => (
                                <div className="space-y-1.5 bg-warning/5 p-2 px-3 rounded-lg border border-warning/20">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-semibold text-warning-foreground uppercase tracking-wider">
                                            {t('admin:cod_amount') || 'COD Due'}
                                        </Label>
                                        {formValues.payment_method === 'cash' && (
                                            <Badge
                                                variant="outline"
                                                className="text-[8px] border-warning/30 bg-warning/10 text-warning font-semibold uppercase px-1 py-0"
                                            >
                                                {t('admin:auto') || 'Auto'}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            disabled={formValues.payment_method === 'cash'}
                                            className="h-8 pl-8 text-xs font-mono font-semibold text-foreground bg-background border-warning/20"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItemsSection;
