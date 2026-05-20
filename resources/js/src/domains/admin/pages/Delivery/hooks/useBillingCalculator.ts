import { useEffect } from 'react';

interface BillingFormValues {
    items: { product_name: string; quantity: number; unit_price: number }[];
    discount_type: 'percentage' | 'fixed' | '';
    discount_value: number;
    tax_percent: number;
    paid_amount: number;
    exchange_rate: number;
    payment_method: string;
    // read-only snapshots for deviation checks
    subtotal: number;
    subtotal_khr: number;
    taxable_amount: number;
    discount_total: number;
    tax_total: number;
    grand_total: number;
    grand_total_khr: number;
    balance_amount: number;
    payment_status: string;
    order_status: string;
    amount_due_cod: number;
}

interface UseBillingCalculatorOptions {
    formValues: BillingFormValues;
    activeExchangeRate: number;
    isEditing: boolean;
    setField: (name: string, value: any) => void;
}

/**
 * Reactive billing calculator hook.
 * Watches form values and auto-computes derived financial fields
 * (subtotal, discount, tax, grand total, KHR conversions, payment status).
 * Uses deviation checks to prevent infinite re-render loops.
 */
export function useBillingCalculator({
    formValues,
    activeExchangeRate,
    isEditing,
    setField,
}: UseBillingCalculatorOptions) {
    useEffect(() => {
        if (!formValues) return;

        // 1. Subtotal
        const subtotal = (formValues.items || []).reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + qty * price;
        }, 0);

        // 2. Discount
        let discountAmt = 0;
        const discVal = Number(formValues.discount_value) || 0;
        if (formValues.discount_type === 'percentage') {
            discountAmt = subtotal * (discVal / 100);
        } else if (formValues.discount_type === 'fixed') {
            discountAmt = Math.min(discVal, subtotal);
        }

        // 3. Taxable amount
        const taxable = Math.max(0, subtotal - discountAmt);

        // 4. Tax total
        const taxRate = Number(formValues.tax_percent) || 0;
        const taxAmt = taxable * (taxRate / 100);

        // 5. Grand total
        const grandTotal = taxable + taxAmt;

        // 6. Balance
        const paidAmt = Number(formValues.paid_amount) || 0;
        const balanceAmt = Math.max(0, grandTotal - paidAmt);

        // 7. KHR conversions
        const rate = Number(formValues.exchange_rate) || activeExchangeRate;
        const subtotalKhr = subtotal * rate;
        const grandTotalKhr = grandTotal * rate;

        // 8. Payment status
        let payStatus = 'unpaid';
        if (paidAmt >= grandTotal && grandTotal > 0) {
            payStatus = 'paid';
        } else if (paidAmt > 0 && paidAmt < grandTotal) {
            payStatus = 'partially_paid';
        }

        // 9. Order status
        let orderStatus = formValues.order_status || 'pending';
        if (payStatus === 'paid') {
            orderStatus = 'paid';
        }

        // 10. Batch-set with floating deviation guard to avoid infinite loops
        if (Math.abs(subtotal - formValues.subtotal) > 0.005)
            setField('subtotal', Number(subtotal.toFixed(2)));
        if (Math.abs(discountAmt - formValues.discount_total) > 0.005)
            setField('discount_total', Number(discountAmt.toFixed(2)));
        if (Math.abs(taxable - formValues.taxable_amount) > 0.005)
            setField('taxable_amount', Number(taxable.toFixed(2)));
        if (Math.abs(taxAmt - formValues.tax_total) > 0.005)
            setField('tax_total', Number(taxAmt.toFixed(2)));
        if (Math.abs(grandTotal - formValues.grand_total) > 0.005)
            setField('grand_total', Number(grandTotal.toFixed(2)));
        if (Math.abs(balanceAmt - formValues.balance_amount) > 0.005)
            setField('balance_amount', Number(balanceAmt.toFixed(2)));
        if (Math.abs(subtotalKhr - formValues.subtotal_khr) > 0.005)
            setField('subtotal_khr', Number(subtotalKhr.toFixed(0)));
        if (Math.abs(grandTotalKhr - formValues.grand_total_khr) > 0.005)
            setField('grand_total_khr', Number(grandTotalKhr.toFixed(0)));
        if (payStatus !== formValues.payment_status)
            setField('payment_status', payStatus);
        if (orderStatus !== formValues.order_status)
            setField('order_status', orderStatus);

        // Cash COD auto-sync
        if (formValues.payment_method === 'cash') {
            if (Math.abs(balanceAmt - formValues.amount_due_cod) > 0.005)
                setField('amount_due_cod', Number(balanceAmt.toFixed(2)));
        } else if (formValues.amount_due_cod > 0 && !isEditing) {
            setField('amount_due_cod', 0);
        }
    }, [
        JSON.stringify(formValues.items),
        formValues.discount_type,
        formValues.discount_value,
        formValues.tax_percent,
        formValues.paid_amount,
        formValues.exchange_rate,
        formValues.payment_method,
        activeExchangeRate,
    ]);
}
