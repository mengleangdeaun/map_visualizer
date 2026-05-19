import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useStore } from '@tanstack/react-form';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useSystemSettings } from '@/domains/system/pages/Settings/hooks/useSystemSettings';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { companyService } from '@/domains/system/services/companyService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Loader2, 
    Plus, 
    Trash2, 
    MapPin, 
    Truck, 
    User as UserIcon, 
    DollarSign, 
    Scale,
    Activity,
    ClipboardList,
    Layers,
    CalendarDays
} from 'lucide-react';

import { useCreateDelivery, useUpdateDelivery } from '../hooks/useDeliveries';
import { useCustomers } from '@/domains/admin/hooks/useCustomers';
import { useLocations } from '@/domains/system/pages/Location/hooks/useLocations';
import { useUsers } from '@/domains/admin/pages/User/hooks/useUsers';
import { Delivery } from '@/domains/admin/services/deliveryService';

import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Maplibre components
import { Map, MapControls, MapMarker, MarkerContent } from '@/components/ui/map';

interface DeliveryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    delivery?: Delivery;
    onSuccess?: (delivery: Delivery) => void;
}

interface FormItem {
    product_name: string;
    quantity: number;
    unit_price: number;
}

const DeliveryDialog = ({ open, onOpenChange, delivery, onSuccess }: DeliveryDialogProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const createMutation = useCreateDelivery();
    const updateMutation = useUpdateDelivery();

    const isEditing = !!delivery;

    // Fetch related collections scoped to the enterprise context
    const { data: customersData } = useCustomers({ per_page: 100 });
    const { data: locationsData } = useLocations({ per_page: 100 });
    const { data: driversData } = useUsers({ role: 'driver', status: 'active', per_page: 100 });

    // Fetch active company details and system settings for exchange rate resolution
    const { user } = useAuthStore();
    const { data: systemSettings } = useSystemSettings();
    const { data: companyData } = useQuery({
        queryKey: ['active-company', user?.company_id],
        queryFn: () => user?.company_id ? companyService.getCompany(user.company_id) : null,
        enabled: !!user?.company_id
    });

    const activeExchangeRate = useMemo(() => {
        if (companyData) {
            if (companyData.exchange_rate_mode === 'override' && companyData.exchange_rate_override_value) {
                return Number(companyData.exchange_rate_override_value);
            }
        }
        if (systemSettings) {
            return Number(systemSettings.exchange_rate_current_value);
        }
        return 4000; // fallback standard KHR rate
    }, [companyData, systemSettings]);

    // Local state for interactive map pin drop
    const [pinCoords, setPinCoords] = useState<[number, number] | null>(null);
    const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
    const [mapViewport, setMapViewport] = useState({
        center: [104.9282, 11.5564] as [number, number], // Default Phnom Penh
        zoom: 12,
        bearing: 0,
        pitch: 0,
    });

    // Form initialization using TanStack Form
    const form = useForm({
        defaultValues: {
            customer_id: delivery?.order?.customer_id || "",
            payment_method: delivery?.order?.payment_method || "cash",
            currency_code: delivery?.order?.currency_code || "USD",
            
            // Refactored Invoicing Fields
            order_date: delivery?.order?.order_date ? new Date(delivery.order.order_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            subtotal: delivery?.order?.subtotal || 0,
            subtotal_khr: delivery?.order?.subtotal_khr || 0,
            taxable_amount: delivery?.order?.taxable_amount || 0,
            tax_percent: delivery?.order?.tax_percent || 0,
            tax_total: delivery?.order?.tax_total || 0,
            discount_type: (delivery?.order?.discount_type || "") as 'percentage' | 'fixed' | "",
            discount_value: delivery?.order?.discount_value || 0,
            discount_total: delivery?.order?.discount_total || 0,
            grand_total: delivery?.order?.grand_total || 0,
            grand_total_khr: delivery?.order?.grand_total_khr || 0,
            paid_amount: delivery?.order?.paid_amount || 0,
            balance_amount: delivery?.order?.balance_amount || 0,
            exchange_rate: delivery?.order?.exchange_rate || activeExchangeRate,
            payment_status: delivery?.order?.payment_status || "unpaid",
            order_status: delivery?.order?.status || "pending",
            amount_due_cod: delivery?.order?.amount_due_cod || 0,
            
            // Nested items list
            items: (delivery?.order?.items || [
                { product_name: "", quantity: 1, unit_price: 0 }
            ]) as FormItem[],

            // Multi-stop parameters
            stops: (delivery?.order?.deliveries && delivery.order.deliveries.length > 0
                ? delivery.order.deliveries.map(d => ({
                    id: d.id,
                    weight_kg: Number(d.weight_kg) || 0,
                    dropoff_address: d.dropoff_address || "",
                    dropoff_latitude: d.dropoff_latitude ? Number(d.dropoff_latitude) : null,
                    dropoff_longitude: d.dropoff_longitude ? Number(d.dropoff_longitude) : null,
                    origin_hub_id: d.origin_hub_id || "",
                    current_hub_id: d.current_hub_id || "",
                    driver_id: d.driver_id || "",
                    status: d.status || "pending",
                    sequence_number: d.sequence_number || 1
                }))
                : [
                    {
                        weight_kg: delivery?.weight_kg || 0,
                        dropoff_address: delivery?.dropoff_address || "",
                        dropoff_latitude: delivery?.dropoff_latitude || null,
                        dropoff_longitude: delivery?.dropoff_longitude || null,
                        origin_hub_id: delivery?.origin_hub_id || "",
                        current_hub_id: delivery?.current_hub_id || "",
                        driver_id: delivery?.driver_id || "",
                        status: delivery?.status || "pending",
                        sequence_number: delivery?.sequence_number || 1
                    }
                ]
            ) as any[],
        },
        onSubmit: async ({ value }) => {
            try {
                // Ensure coordinates and financials are strictly decimals/numbers or null
                const payload = {
                    ...value,
                    subtotal: Number(value.subtotal),
                    subtotal_khr: Number(value.subtotal_khr),
                    taxable_amount: Number(value.taxable_amount),
                    tax_percent: Number(value.tax_percent),
                    tax_total: Number(value.tax_total),
                    discount_type: value.discount_type || null,
                    discount_value: Number(value.discount_value),
                    discount_total: Number(value.discount_total),
                    grand_total: Number(value.grand_total),
                    grand_total_khr: Number(value.grand_total_khr),
                    paid_amount: Number(value.paid_amount),
                    balance_amount: Number(value.balance_amount),
                    exchange_rate: Number(value.exchange_rate),
                    payment_status: value.payment_status,
                    order_status: value.order_status,
                    amount_due_cod: Number(value.amount_due_cod),
                    stops: value.stops.map((stop: any, idx: number) => ({
                        ...stop,
                        weight_kg: Number(stop.weight_kg) || 0,
                        dropoff_latitude: stop.dropoff_latitude ? Number(stop.dropoff_latitude) : null,
                        dropoff_longitude: stop.dropoff_longitude ? Number(stop.dropoff_longitude) : null,
                        sequence_number: stop.sequence_number ? Number(stop.sequence_number) : (idx + 1),
                    })),
                };

                if (isEditing && delivery) {
                    await updateMutation.mutateAsync({
                        id: delivery.id,
                        data: payload,
                    });
                    onOpenChange(false);
                } else {
                    const newDelivery = await createMutation.mutateAsync(payload);
                    if (onSuccess) onSuccess(newDelivery);
                    onOpenChange(false);
                }
            } catch (error) {
                // Handled in Mutation
            }
        },
    });

    // Reactive dynamic billing calculator hook
    const formValues = useStore(form.store, (state) => state.values);
    const formItems = formValues.items;

    useEffect(() => {
        if (!formValues) return;

        // 1. Calculate raw Subtotal
        const subtotal = (formValues.items || []).reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + (qty * price);
        }, 0);

        // 2. Calculate Discount Total
        let discountAmt = 0;
        const discVal = Number(formValues.discount_value) || 0;
        if (formValues.discount_type === 'percentage') {
            discountAmt = subtotal * (discVal / 100);
        } else if (formValues.discount_type === 'fixed') {
            discountAmt = Math.min(discVal, subtotal);
        }

        // 3. Calculate Taxable Amount
        const taxable = Math.max(0, subtotal - discountAmt);

        // 4. Calculate Tax Total
        const taxRate = Number(formValues.tax_percent) || 0;
        const taxAmt = taxable * (taxRate / 100);

        // 5. Grand Total
        const grandTotal = taxable + taxAmt;

        // 6. Balance Amount
        const paidAmt = Number(formValues.paid_amount) || 0;
        const balanceAmt = Math.max(0, grandTotal - paidAmt);

        // 7. KHR Conversions using snap exchange rate
        const rate = Number(formValues.exchange_rate) || activeExchangeRate;
        const subtotalKhr = subtotal * rate;
        const grandTotalKhr = grandTotal * rate;

        // 8. Payment Status
        let payStatus = 'unpaid';
        if (paidAmt >= grandTotal && grandTotal > 0) {
            payStatus = 'paid';
        } else if (paidAmt > 0 && paidAmt < grandTotal) {
            payStatus = 'partially_paid';
        }

        // 9. Order Status
        let orderStatus = formValues.order_status || 'pending';
        if (payStatus === 'paid') {
            orderStatus = 'paid';
        }

        // 10. Update state with floating deviations check to avoid infinite re-renders
        if (Math.abs(subtotal - formValues.subtotal) > 0.005) {
            form.setFieldValue('subtotal', Number(subtotal.toFixed(2)));
        }
        if (Math.abs(discountAmt - formValues.discount_total) > 0.005) {
            form.setFieldValue('discount_total', Number(discountAmt.toFixed(2)));
        }
        if (Math.abs(taxable - formValues.taxable_amount) > 0.005) {
            form.setFieldValue('taxable_amount', Number(taxable.toFixed(2)));
        }
        if (Math.abs(taxAmt - formValues.tax_total) > 0.005) {
            form.setFieldValue('tax_total', Number(taxAmt.toFixed(2)));
        }
        if (Math.abs(grandTotal - formValues.grand_total) > 0.005) {
            form.setFieldValue('grand_total', Number(grandTotal.toFixed(2)));
        }
        if (Math.abs(balanceAmt - formValues.balance_amount) > 0.005) {
            form.setFieldValue('balance_amount', Number(balanceAmt.toFixed(2)));
        }
        if (Math.abs(subtotalKhr - formValues.subtotal_khr) > 0.005) {
            form.setFieldValue('subtotal_khr', Number(subtotalKhr.toFixed(0)));
        }
        if (Math.abs(grandTotalKhr - formValues.grand_total_khr) > 0.005) {
            form.setFieldValue('grand_total_khr', Number(grandTotalKhr.toFixed(0)));
        }
        if (payStatus !== formValues.payment_status) {
            form.setFieldValue('payment_status', payStatus as any);
        }
        if (orderStatus !== formValues.order_status) {
            form.setFieldValue('order_status', orderStatus as any);
        }

        // Cash COD payment automatic tracking sync
        if (formValues.payment_method === 'cash') {
            const codAmt = balanceAmt;
            if (Math.abs(codAmt - formValues.amount_due_cod) > 0.005) {
                form.setFieldValue('amount_due_cod', Number(codAmt.toFixed(2)));
            }
        } else if (formValues.amount_due_cod > 0 && !isEditing) {
            form.setFieldValue('amount_due_cod', 0);
        }
    }, [
        JSON.stringify(formValues.items),
        formValues.discount_type,
        formValues.discount_value,
        formValues.tax_percent,
        formValues.paid_amount,
        formValues.exchange_rate,
        formValues.payment_method,
        activeExchangeRate
    ]);

    // Sync Pin and viewport when editing opens
    useEffect(() => {
        if (open) {
            const initialStops = delivery?.order?.deliveries && delivery.order.deliveries.length > 0
                ? delivery.order.deliveries.map(d => ({
                    id: d.id,
                    weight_kg: Number(d.weight_kg) || 0,
                    dropoff_address: d.dropoff_address || "",
                    dropoff_latitude: d.dropoff_latitude ? Number(d.dropoff_latitude) : null,
                    dropoff_longitude: d.dropoff_longitude ? Number(d.dropoff_longitude) : null,
                    origin_hub_id: d.origin_hub_id || "",
                    current_hub_id: d.current_hub_id || "",
                    driver_id: d.driver_id || "",
                    status: d.status || "pending",
                    sequence_number: d.sequence_number || 1
                }))
                : [
                    {
                        weight_kg: delivery?.weight_kg || 0,
                        dropoff_address: delivery?.dropoff_address || "",
                        dropoff_latitude: delivery?.dropoff_latitude ? Number(delivery.dropoff_latitude) : null,
                        dropoff_longitude: delivery?.dropoff_longitude ? Number(delivery.dropoff_longitude) : null,
                        origin_hub_id: delivery?.origin_hub_id || "",
                        current_hub_id: delivery?.current_hub_id || "",
                        driver_id: delivery?.driver_id || "",
                        status: delivery?.status || "pending",
                        sequence_number: delivery?.sequence_number || 1
                    }
                ];

            form.reset({
                customer_id: delivery?.order?.customer_id || "",
                payment_method: delivery?.order?.payment_method || "cash",
                currency_code: delivery?.order?.currency_code || "USD",
                order_date: delivery?.order?.order_date ? new Date(delivery.order.order_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                subtotal: delivery?.order?.subtotal || 0,
                subtotal_khr: delivery?.order?.subtotal_khr || 0,
                taxable_amount: delivery?.order?.taxable_amount || 0,
                tax_percent: delivery?.order?.tax_percent || 0,
                tax_total: delivery?.order?.tax_total || 0,
                discount_type: (delivery?.order?.discount_type || "") as 'percentage' | 'fixed' | "",
                discount_value: delivery?.order?.discount_value || 0,
                discount_total: delivery?.order?.discount_total || 0,
                grand_total: delivery?.order?.grand_total || 0,
                grand_total_khr: delivery?.order?.grand_total_khr || 0,
                paid_amount: delivery?.order?.paid_amount || 0,
                balance_amount: delivery?.order?.balance_amount || 0,
                exchange_rate: delivery?.order?.exchange_rate || activeExchangeRate,
                payment_status: delivery?.order?.payment_status || "unpaid",
                order_status: delivery?.order?.status || "pending",
                amount_due_cod: delivery?.order?.amount_due_cod || 0,
                items: (delivery?.order?.items || [
                    { product_name: "", quantity: 1, unit_price: 0 }
                ]) as FormItem[],
                stops: initialStops as any[]
            });

            setActiveStopIndex(0);

            const activeStop = initialStops[0];
            if (activeStop?.dropoff_latitude && activeStop?.dropoff_longitude) {
                const lat = Number(activeStop.dropoff_latitude);
                const lng = Number(activeStop.dropoff_longitude);
                setPinCoords([lng, lat]);
                setMapViewport(prev => ({
                    ...prev,
                    center: [lng, lat],
                    zoom: 14
                }));
            } else {
                setPinCoords(null);
            }
        }
    }, [delivery, open, activeExchangeRate]);

    // Live calculation of grand totals is handled fully inside the comprehensive reactive invoicing effect above

    // Handle clicking map to set dropoff coordinates for active stop
    const handleMapClick = (e: any) => {
        const { lng, lat } = e.lngLat;
        setPinCoords([lng, lat]);
        
        const stops = [...(formValues.stops || [])];
        if (stops[activeStopIndex]) {
            stops[activeStopIndex] = {
                ...stops[activeStopIndex],
                dropoff_latitude: Number(lat.toFixed(6)),
                dropoff_longitude: Number(lng.toFixed(6))
            };
            form.setFieldValue('stops', stops);
        }
    };

    // Handle pin dragging end for active stop
    const handlePinDragEnd = (lngLat: { lng: number; lat: number }) => {
        setPinCoords([lngLat.lng, lngLat.lat]);
        
        const stops = [...(formValues.stops || [])];
        if (stops[activeStopIndex]) {
            stops[activeStopIndex] = {
                ...stops[activeStopIndex],
                dropoff_latitude: Number(lngLat.lat.toFixed(6)),
                dropoff_longitude: Number(lngLat.lng.toFixed(6))
            };
            form.setFieldValue('stops', stops);
        }
    };

    // Synchronize map pin coordinates and viewport when active stop changes
    useEffect(() => {
        const activeStop = formValues?.stops?.[activeStopIndex];
        if (activeStop?.dropoff_longitude && activeStop?.dropoff_latitude) {
            setPinCoords([Number(activeStop.dropoff_longitude), Number(activeStop.dropoff_latitude)]);
            setMapViewport(prev => ({
                ...prev,
                center: [Number(activeStop.dropoff_longitude), Number(activeStop.dropoff_latitude)]
            }));
        } else {
            setPinCoords(null);
        }
    }, [activeStopIndex]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] xl:max-w-[1400px] h-[92vh] max-h-[92vh] gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr] overflow-hidden rounded-xl border">
                <DialogHeader className="p-5 border-b bg-background flex-shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-extrabold text-primary flex items-center gap-2">
                            <Truck className="size-5 text-primary" />
                            {isEditing ? t('admin:edit_delivery') || 'Edit Delivery' : t('admin:create_new_delivery') || 'Create New Delivery'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {t('admin:delivery_description_desc') || 'Assign customer details, items checklist, and specify geo drop-off coordinates.'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form 
                    id="delivery-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex flex-col min-h-0 overflow-hidden"
                >
                    <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-0 overflow-hidden">
                        
                        {/* Left Column: Order details & Dynamic Items Table */}
                        <div className="xl:col-span-5 flex flex-col min-h-0 border-r overflow-hidden bg-muted/5">
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-6 space-y-6">
                                    
                                    {/* Section 1: Customer details & Order Date */}
                                    <div className="bg-card p-4 rounded-xl border shadow-xs space-y-4">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b pb-2">
                                            <UserIcon className="size-4 text-primary" />
                                            {t('admin:customer_information') || 'Customer Information'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <form.Field
                                                name="customer_id"
                                                validators={{
                                                    onChange: z.string().min(1, "Customer is required")
                                                }}
                                                children={(field) => (
                                                    <div className="space-y-1.5 flex flex-col justify-end">
                                                        <Label htmlFor={field.name} className="text-xs font-semibold">{t('admin:select_customer') || 'Customer'}</Label>
                                                        <SearchableSelect
                                                            options={customersData?.data || []}
                                                            value={field.state.value}
                                                            onChange={(val) => field.handleChange(val || "")}
                                                            placeholder={t('admin:select_customer') || 'Select Customer'}
                                                            searchPlaceholder={t('admin:search_customer') || 'Search customer...'}
                                                            getOptionValue={(c: any) => c.id}
                                                            getOptionLabel={(c: any) => `${c.name} (${c.phone})`}
                                                            getOptionSearchTerms={(c: any) => [c.name, c.phone]}
                                                            renderOption={(c: any) => (
                                                                <div className="flex flex-col py-0.5">
                                                                    <span className="font-bold text-xs text-foreground">{c.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground font-mono">{c.phone}</span>
                                                                </div>
                                                            )}
                                                        />
                                                        {field.state.meta.errors.length > 0 && (
                                                            <p className="text-[10px] text-destructive">
                                                                {field.state.meta.errors.map(err => typeof err === 'object' ? (err as any)?.message : err).join(", ")}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            />

                                            <form.Field
                                                name="order_date"
                                                children={(field) => (
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

                                            <form.Field
                                                name="payment_method"
                                                children={(field) => (
                                                    <div className="space-y-1.5 flex flex-col justify-end">
                                                        <Label htmlFor={field.name} className="text-xs font-semibold">{t('admin:payment_method') || 'Payment Method'}</Label>
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

                                    {/* Section 2: Order Items (Dynamic items array) */}
                                    <div className="bg-card p-4 rounded-xl border shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
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
                                                        { product_name: "", quantity: 1, unit_price: 0 }
                                                    ]);
                                                }}
                                                className="h-7 text-xs gap-1 border-primary/20 hover:bg-primary/5 text-primary"
                                            >
                                                <Plus className="size-3" />
                                                {t('admin:add_item') || 'Add Item'}
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {formItems?.map((item: FormItem, idx: number) => (
                                                <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-muted/10 p-3 rounded-lg border">
                                                    
                                                    <div className="col-span-6 space-y-1">
                                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:product_name') || 'Product Name'}</Label>
                                                        <Input
                                                            placeholder="Product A"
                                                            className="h-8 text-xs bg-background"
                                                            value={item.product_name}
                                                            onChange={(e) => {
                                                                const updated = [...formItems];
                                                                updated[idx].product_name = e.target.value;
                                                                form.setFieldValue('items', updated);
                                                            }}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="col-span-2 space-y-1">
                                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:qty') || 'Qty'}</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            className="h-8 text-xs bg-background"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const updated = [...formItems];
                                                                updated[idx].quantity = Math.max(1, Number(e.target.value));
                                                                form.setFieldValue('items', updated);
                                                            }}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="col-span-3 space-y-1">
                                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:price') || 'Price'}</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="h-8 text-xs bg-background"
                                                            value={item.unit_price}
                                                            onChange={(e) => {
                                                                const updated = [...formItems];
                                                                updated[idx].unit_price = Math.max(0, Number(e.target.value));
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
                                                                const updated = formItems.filter((_item: FormItem, i: number) => i !== idx);
                                                                form.setFieldValue('items', updated);
                                                            }}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>

                                        {/* Financial Summary card grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                                            
                                            {/* Column 1: Adjustments (Discount & Tax inputs) */}
                                            <div className="space-y-4 pr-0 md:pr-4 md:border-r border-border/60">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                    {t('admin:financial_adjustments') || 'Financial Adjustments'}
                                                </h4>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Currency selector using Select UI component */}
                                                    <form.Field
                                                        name="currency_code"
                                                        children={(field) => (
                                                            <div className="space-y-1.5 col-span-2">
                                                                <Label className="text-xs font-semibold text-muted-foreground">{t('admin:currency') || 'Currency'}</Label>
                                                                <Select
                                                                    value={field.state.value}
                                                                    onValueChange={(val) => field.handleChange(val as any)}
                                                                >
                                                                    <SelectTrigger className="h-9 text-xs font-bold bg-background">
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

                                                    {/* Exchange Rate Snap */}
                                                    <form.Field
                                                        name="exchange_rate"
                                                        children={(field) => (
                                                            <div className="space-y-1.5 col-span-2">
                                                                <Label className="text-xs font-semibold text-muted-foreground">{t('admin:exchange_rate') || 'Exchange Rate (USD to KHR)'}</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        step="1"
                                                                        className="h-9 text-xs bg-background pr-10 font-mono font-bold"
                                                                        value={field.state.value}
                                                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground font-mono">៛/USD</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    />

                                                    {/* Discount Type */}
                                                    <form.Field
                                                        name="discount_type"
                                                        children={(field) => (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-muted-foreground">{t('admin:discount_type') || 'Discount Type'}</Label>
                                                                <Select
                                                                    value={field.state.value || "none"}
                                                                    onValueChange={(val) => field.handleChange(val === "none" ? "" : (val as any))}
                                                                >
                                                                    <SelectTrigger className="!h-9 text-xs bg-background">
                                                                        <SelectValue placeholder="None" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">{t('admin:none', 'None')}</SelectItem>
                                                                        <SelectItem value="percentage">{t('admin:percentage', 'Percentage (%)')}</SelectItem>
                                                                        <SelectItem value="fixed">{t('admin:fixed_amount', 'Fixed Amount ($)')}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    />

                                                    {/* Discount Value */}
                                                    <form.Field
                                                        name="discount_value"
                                                        children={(field) => (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-muted-foreground">{t('admin:discount_value') || 'Discount Value'}</Label>
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

                                                    {/* Tax rate */}
                                                    <form.Field
                                                        name="tax_percent"
                                                        children={(field) => (
                                                            <div className="space-y-1.5 col-span-2">
                                                                <Label className="text-xs font-semibold text-muted-foreground">{t('admin:tax_rate') || 'Tax Rate (%)'}</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        className="h-9 text-xs bg-background pr-8"
                                                                        value={field.state.value}
                                                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                                                        placeholder="0"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            {/* Column 2: Detailed Pricing Summary Card */}
                                            <div className="space-y-3.5 flex flex-col justify-between">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                    {t('admin:invoice_summary') || 'Invoice Breakdown'}
                                                </h4>
                                                
                                                <div className="space-y-2 text-xs font-semibold bg-background p-3.5 rounded-lg border border-border/80 shadow-2xs">
                                                    
                                                    {/* Subtotal */}
                                                    <div className="flex justify-between items-center text-muted-foreground">
                                                        <span>{t('admin:subtotal') || 'Subtotal'}:</span>
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-mono text-foreground font-bold">
                                                                ${Number(formValues.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                ៛{Number(formValues.subtotal_khr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Discount Total */}
                                                    {Number(formValues.discount_total) > 0 && (
                                                        <div className="flex justify-between items-center text-rose-500">
                                                            <span>{t('admin:discount') || 'Discount'} ({formValues.discount_type === 'percentage' ? `${formValues.discount_value}%` : 'Fixed'}):</span>
                                                            <span className="font-mono font-bold">
                                                                -${Number(formValues.discount_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Taxable Amount */}
                                                    {Number(formValues.discount_total) > 0 && (
                                                        <div className="flex justify-between items-center text-muted-foreground/80 border-t pt-1.5">
                                                            <span>{t('admin:taxable_subtotal') || 'Taxable Amount'}:</span>
                                                            <span className="font-mono text-foreground font-bold">
                                                                ${Number(formValues.taxable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Tax Total */}
                                                    {Number(formValues.tax_percent) > 0 && (
                                                        <div className="flex justify-between items-center text-amber-600 dark:text-amber-500">
                                                            <span>{t('admin:tax') || 'Tax'} ({formValues.tax_percent}%):</span>
                                                            <span className="font-mono font-bold">
                                                                +${Number(formValues.tax_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Grand Total */}
                                                    <div className="flex justify-between items-center text-sm font-black border-t border-dashed pt-2 text-primary">
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
                                                        <span className="flex items-center gap-1">
                                                            {t('admin:paid_amount') || 'Paid Amount'}
                                                        </span>
                                                        <span className="font-mono text-emerald-600 dark:text-emerald-500 font-bold">
                                                            ${Number(formValues.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    {/* Balance Amount */}
                                                    <div className="flex justify-between items-center text-muted-foreground/80">
                                                        <span>{t('admin:balance_amount') || 'Balance Amount'}:</span>
                                                        <span className="font-mono text-red-500 font-bold">
                                                            ${Number(formValues.balance_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    {/* Payment Status Badge */}
                                                    <div className="flex justify-between items-center pt-1">
                                                        <span>{t('admin:payment_status') || 'Payment Status'}:</span>
                                                        <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                                                            formValues.payment_status === 'paid' 
                                                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                                : formValues.payment_status === 'partially_paid'
                                                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                                                    : 'bg-red-500/20 text-red-700 dark:text-red-300'
                                                        }`}>
                                                            {formValues.payment_status === 'paid' ? (t('admin:paid') || 'Paid') : formValues.payment_status === 'partially_paid' ? (t('admin:partially_paid') || 'Partially Paid') : (t('admin:unpaid') || 'Unpaid')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Paid Amount Input */}
                                                    <form.Field
                                                        name="paid_amount"
                                                        children={(field) => (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                    {t('admin:paid_amount') || 'Amount Paid'}
                                                                </Label>
                                                                <div className="relative">
                                                                    <DollarSign className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                                    <Input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        className="h-9 pl-8 text-xs font-mono font-bold text-foreground bg-background"
                                                                        value={field.state.value}
                                                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    />

                                                    {/* COD Input */}
                                                    <form.Field
                                                        name="amount_due_cod"
                                                        children={(field) => (
                                                            <div className="space-y-1.5 bg-yellow-500/5 dark:bg-yellow-500/10 p-2 px-3 rounded-lg border border-yellow-500/20">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                                                        {t('admin:cod_amount') || 'COD Due'}
                                                                    </Label>
                                                                    {formValues.payment_method === 'cash' && (
                                                                        <span className="text-[8px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold px-1 py-0.5 rounded uppercase">
                                                                            Auto
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <DollarSign className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                                    <Input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        disabled={formValues.payment_method === 'cash'}
                                                                        className="h-8 pl-8 text-xs font-mono font-bold text-foreground bg-background border-amber-500/20"
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
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right Column: Logistics Details & Interactive Coordinate Picker */}
                        <div className="xl:col-span-7 flex flex-col min-h-0 overflow-hidden bg-background">
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-6 space-y-6">
                                    
                                    {/* Shipping logistics parameters with unified multi-stop visual planner */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <Layers className="size-4 text-primary" />
                                                {t('admin:logistics_details') || 'Logistics & Dispatch'}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Column 1: Stops list sidebar */}
                                            <div className="md:col-span-1 border-r pr-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                        Stops list ({formValues.stops?.length || 0})
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-[10px] gap-1 font-bold border-dashed border-primary text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            const stops = [...(formValues.stops || [])];
                                                            stops.push({
                                                                weight_kg: 0,
                                                                dropoff_address: "",
                                                                dropoff_latitude: null,
                                                                dropoff_longitude: null,
                                                                origin_hub_id: stops[stops.length - 1]?.origin_hub_id || "",
                                                                current_hub_id: stops[stops.length - 1]?.current_hub_id || "",
                                                                driver_id: stops[stops.length - 1]?.driver_id || "",
                                                                status: "pending",
                                                                sequence_number: stops.length + 1
                                                            });
                                                            form.setFieldValue('stops', stops);
                                                            setActiveStopIndex(stops.length - 1);
                                                        }}
                                                    >
                                                        <Plus className="size-3" />
                                                        Add Stop
                                                    </Button>
                                                </div>

                                                <div className="h-[480px] overflow-y-auto space-y-2 pr-1">
                                                    {formValues.stops?.map((stop: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                                                                idx === activeStopIndex
                                                                    ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                                                                    : "bg-muted/10 hover:bg-muted/30 border-border"
                                                            }`}
                                                            onClick={() => setActiveStopIndex(idx)}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                                                    idx === activeStopIndex
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "bg-muted text-muted-foreground"
                                                                }`}>
                                                                    Stop {stop.sequence_number || (idx + 1)}
                                                                </span>
                                                                {formValues.stops.length > 1 && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-5 text-destructive hover:bg-destructive/10"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const stops = [...formValues.stops];
                                                                            stops.splice(idx, 1);
                                                                            form.setFieldValue('stops', stops);
                                                                            setActiveStopIndex(Math.max(0, idx - 1));
                                                                        }}
                                                                    >
                                                                        <Trash2 className="size-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-medium text-foreground block truncate">
                                                                {stop.dropoff_address || "No address entered"}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                <span className="text-[9px] text-muted-foreground font-mono">
                                                                    {stop.weight_kg ? `${stop.weight_kg} kg` : '0 kg'}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground font-mono">•</span>
                                                                <span className={`text-[9px] font-bold ${
                                                                    stop.status === 'delivered' ? 'text-emerald-500' :
                                                                    stop.status === 'failed' ? 'text-destructive' : 'text-amber-500'
                                                                }`}>
                                                                    {stop.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column 2 & 3: Active Stop Inputs & Map Coordinate Picker */}
                                            <div className="md:col-span-2 space-y-4">
                                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 mb-2">
                                                    <span className="text-xs font-black text-primary block uppercase">
                                                        Editing Stop {formValues.stops[activeStopIndex]?.sequence_number || (activeStopIndex + 1)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Update details and pick geographic location below for this specific stop.
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold flex items-center gap-1">
                                                            <Scale className="size-3 text-muted-foreground" />
                                                            {t('admin:weight_kg') || 'Weight (KG)'}
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            className="h-9"
                                                            value={formValues.stops[activeStopIndex]?.weight_kg || 0}
                                                            onChange={(e) => {
                                                                const stops = [...formValues.stops];
                                                                stops[activeStopIndex] = {
                                                                    ...stops[activeStopIndex],
                                                                    weight_kg: Number(e.target.value)
                                                                };
                                                                form.setFieldValue('stops', stops);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5 flex flex-col justify-end">
                                                        <Label className="text-xs font-semibold flex items-center gap-1">
                                                            <Activity className="size-3 text-muted-foreground" />
                                                            {t('admin:status') || 'Status'}
                                                        </Label>
                                                        <Select
                                                            value={formValues.stops[activeStopIndex]?.status || "pending"}
                                                            onValueChange={(val) => {
                                                                const stops = [...formValues.stops];
                                                                stops[activeStopIndex] = {
                                                                    ...stops[activeStopIndex],
                                                                    status: val as any
                                                                };
                                                                form.setFieldValue('stops', stops);
                                                            }}
                                                        >
                                                            <SelectTrigger className="!h-9">
                                                                <SelectValue placeholder={t('admin:status') || 'Status'} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">{t('admin:pending') || 'Pending'}</SelectItem>
                                                                <SelectItem value="at_hub">{t('admin:at_hub') || 'At Hub'}</SelectItem>
                                                                <SelectItem value="linehaul">{t('admin:linehaul') || 'Linehaul'}</SelectItem>
                                                                <SelectItem value="out_for_delivery">{t('admin:out_for_delivery') || 'Out For Delivery'}</SelectItem>
                                                                <SelectItem value="delivered">{t('admin:delivered') || 'Delivered'}</SelectItem>
                                                                <SelectItem value="failed">{t('admin:failed') || 'Failed'}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5 flex flex-col justify-end">
                                                        <Label className="text-xs font-semibold flex items-center gap-1">
                                                            <Layers className="size-3 text-muted-foreground" />
                                                            {t('admin:stop_sequence') || 'Stop Sequence'}
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            className="h-9 font-bold text-primary"
                                                            value={formValues.stops[activeStopIndex]?.sequence_number || (activeStopIndex + 1)}
                                                            onChange={(e) => {
                                                                const stops = [...formValues.stops];
                                                                stops[activeStopIndex] = {
                                                                    ...stops[activeStopIndex],
                                                                    sequence_number: Number(e.target.value)
                                                                };
                                                                form.setFieldValue('stops', stops);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5 flex flex-col">
                                                        <Label className="text-xs font-semibold">{t('admin:origin_hub') || 'Origin Hub'}</Label>
                                                        <SearchableSelect
                                                            options={locationsData?.data || []}
                                                            value={formValues.stops[activeStopIndex]?.origin_hub_id || ""}
                                                            onChange={(val) => {
                                                                const stops = [...formValues.stops];
                                                                stops[activeStopIndex] = {
                                                                    ...stops[activeStopIndex],
                                                                    origin_hub_id: val || ""
                                                                };
                                                                form.setFieldValue('stops', stops);
                                                            }}
                                                            placeholder={t('admin:select_hub') || 'Select Hub'}
                                                            getOptionValue={(l: any) => l.id}
                                                            getOptionLabel={(l: any) => l.name}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5 flex flex-col">
                                                        <Label className="text-xs font-semibold">{t('admin:current_hub') || 'Current Hub'}</Label>
                                                        <SearchableSelect
                                                            options={locationsData?.data || []}
                                                            value={formValues.stops[activeStopIndex]?.current_hub_id || ""}
                                                            onChange={(val) => {
                                                                const stops = [...formValues.stops];
                                                                stops[activeStopIndex] = {
                                                                    ...stops[activeStopIndex],
                                                                    current_hub_id: val || ""
                                                                };
                                                                form.setFieldValue('stops', stops);
                                                            }}
                                                            placeholder={t('admin:select_hub') || 'Select Hub'}
                                                            getOptionValue={(l: any) => l.id}
                                                            getOptionLabel={(l: any) => l.name}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 flex flex-col">
                                                    <Label className="text-xs font-semibold">{t('admin:assigned_driver') || 'Assign Driver (Optional)'}</Label>
                                                    <SearchableSelect
                                                        options={driversData?.data || []}
                                                        value={formValues.stops[activeStopIndex]?.driver_id || ""}
                                                        onChange={(val) => {
                                                            const stops = [...formValues.stops];
                                                            stops[activeStopIndex] = {
                                                                ...stops[activeStopIndex],
                                                                driver_id: val || ""
                                                            };
                                                            form.setFieldValue('stops', stops);
                                                        }}
                                                        placeholder={t('admin:select_driver') || 'Unassigned / Available'}
                                                        getOptionValue={(d: any) => d.id}
                                                        getOptionLabel={(d: any) => `${d.name} (${d.phone})`}
                                                        getOptionSearchTerms={(d: any) => [d.name, d.phone]}
                                                        renderOption={(d: any) => (
                                                            <div className="flex flex-col py-0.5">
                                                                <span className="font-bold text-xs text-foreground">{d.name}</span>
                                                                <span className="text-[10px] text-muted-foreground font-mono">{d.phone}</span>
                                                            </div>
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">{t('admin:dropoff_address') || 'Dropoff Address'}</Label>
                                                    <Textarea
                                                        placeholder="Street, City, Block detail..."
                                                        className="min-h-[60px] resize-none text-xs"
                                                        value={formValues.stops[activeStopIndex]?.dropoff_address || ""}
                                                        onChange={(e) => {
                                                            const stops = [...formValues.stops];
                                                            stops[activeStopIndex] = {
                                                                ...stops[activeStopIndex],
                                                                dropoff_address: e.target.value
                                                            };
                                                            form.setFieldValue('stops', stops);
                                                        }}
                                                    />
                                                </div>

                                                {/* Geospatial Coordinate Picker (Maplibre container) */}
                                                <div className="space-y-2 pt-2">
                                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                        <MapPin className="size-4 text-primary animate-bounce" />
                                                        {t('admin:dropoff_geo_location') || 'Dropoff Coordinate Picker'}
                                                    </Label>
                                                    <div className="text-[10px] text-muted-foreground pb-1">
                                                        {t('admin:map_instructions') || 'Click on the map or drag the pin to assign exact drop-off coordinates.'}
                                                    </div>

                                                    {/* Coordinate displays */}
                                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                                        <div className="bg-muted/30 border rounded-md p-1 px-2 text-center">
                                                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">LAT</span>
                                                            <span className="text-xs font-black font-mono text-primary">{formValues.stops[activeStopIndex]?.dropoff_latitude || '-'}</span>
                                                        </div>
                                                        <div className="bg-muted/30 border rounded-md p-1 px-2 text-center">
                                                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">LNG</span>
                                                            <span className="text-xs font-black font-mono text-primary">{formValues.stops[activeStopIndex]?.dropoff_longitude || '-'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="h-[280px] w-full relative overflow-hidden rounded-xl border shadow-inner">
                                                        <Map
                                                            viewport={mapViewport}
                                                            onViewportChange={setMapViewport}
                                                            onClick={handleMapClick}
                                                            className="h-full w-full"
                                                            language="km"
                                                        >
                                                            <MapControls position="top-right" showCompass />
                                                            
                                                            {pinCoords && (
                                                                <MapMarker
                                                                    longitude={pinCoords[0]}
                                                                    latitude={pinCoords[1]}
                                                                    draggable
                                                                    onDragEnd={handlePinDragEnd}
                                                                >
                                                                    <MarkerContent>
                                                                        <div className="relative -top-6 flex flex-col items-center justify-center">
                                                                            <div className="size-8 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                                                                                <MapPin className="size-4 text-white" />
                                                                            </div>
                                                                            <div className="bg-background/90 text-[8px] font-black border p-0.5 px-1 rounded shadow-xs mt-1 border-primary/20">
                                                                                STOP {formValues.stops[activeStopIndex]?.sequence_number || (activeStopIndex + 1)}
                                                                            </div>
                                                                        </div>
                                                                    </MarkerContent>
                                                                </MapMarker>
                                                            )}

                                                            {/* Render other stops' pins in the picker map */}
                                                            {formValues.stops.map((stop: any, idx: number) => {
                                                                if (idx === activeStopIndex) return null; // handled by the bouncing Pin
                                                                if (!stop.dropoff_longitude || !stop.dropoff_latitude) return null;
                                                                
                                                                return (
                                                                    <MapMarker
                                                                        key={idx}
                                                                        longitude={Number(stop.dropoff_longitude)}
                                                                        latitude={Number(stop.dropoff_latitude)}
                                                                        onClick={() => setActiveStopIndex(idx)}
                                                                    >
                                                                        <MarkerContent>
                                                                            <div className="relative cursor-pointer transition-transform duration-200 active:scale-90 flex flex-col items-center justify-center">
                                                                                <div className="size-7 rounded-full bg-sky-500 text-white flex items-center justify-center border-2 border-white shadow-md font-black text-[10px]">
                                                                                    {stop.sequence_number || (idx + 1)}
                                                                                </div>
                                                                            </div>
                                                                        </MarkerContent>
                                                                    </MapMarker>
                                                                );
                                                            })}
                                                        </Map>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t bg-muted/5 flex-shrink-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('cancel') || 'Cancel'}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isPending}
                            className="min-w-[140px] font-bold"
                        >
                            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isEditing ? t('admin:save_changes') || 'Save Changes' : t('admin:create_delivery') || 'Create Delivery'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DeliveryDialog;
