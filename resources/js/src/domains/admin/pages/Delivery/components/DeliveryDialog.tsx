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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Truck } from 'lucide-react';

import { useCreateDelivery, useUpdateDelivery } from '../hooks/useDeliveries';
import { useCustomers } from '@/domains/admin/hooks/useCustomers';
import { useLocations } from '@/domains/system/pages/Location/hooks/useLocations';
import { useUsers } from '@/domains/admin/pages/Member/hooks/useUsers';
import { Delivery } from '@/domains/admin/services/deliveryService';

import { useBillingCalculator } from '../hooks/useBillingCalculator';
import { useDeliveryMap } from '../hooks/useDeliveryMap';

import CustomerInfoSection from './CustomerInfoSection';
import OrderItemsSection from './OrderItemsSection';
import LogisticsSection from './LogisticsSection';

interface DeliveryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    delivery?: Delivery;
    onSuccess?: (delivery: Delivery) => void;
    initialValues?: {
        dropoff_latitude?: number | null;
        dropoff_longitude?: number | null;
        dropoff_address?: string;
    };
}

interface FormItem {
    product_name: string;
    quantity: number;
    unit_price: number;
}

/** Builds the initial stops array from a delivery object */
function buildInitialStops(delivery?: Delivery, initialValues?: DeliveryDialogProps['initialValues']): any[] {
    if (delivery?.order?.deliveries && delivery.order.deliveries.length > 0) {
        return delivery.order.deliveries.map((d) => ({
            id: d.id,
            weight_kg: Number(d.weight_kg) || 0,
            dropoff_address: d.dropoff_address || '',
            dropoff_latitude: d.dropoff_latitude ? Number(d.dropoff_latitude) : null,
            dropoff_longitude: d.dropoff_longitude ? Number(d.dropoff_longitude) : null,
            origin_hub_id: d.origin_hub_id || '',
            current_hub_id: d.current_hub_id || '',
            driver_id: d.driver_id || '',
            status: d.status || 'pending',
            sequence_number: d.sequence_number || 1,
            scheduled_at: d.scheduled_at ? new Date(d.scheduled_at).toISOString().slice(0, 16) : '',
        }));
    }
    return [
        {
            weight_kg: delivery?.weight_kg || 0,
            dropoff_address: delivery?.dropoff_address || initialValues?.dropoff_address || '',
            dropoff_latitude: delivery?.dropoff_latitude ? Number(delivery.dropoff_latitude) : initialValues?.dropoff_latitude ? Number(initialValues.dropoff_latitude) : null,
            dropoff_longitude: delivery?.dropoff_longitude ? Number(delivery.dropoff_longitude) : initialValues?.dropoff_longitude ? Number(initialValues.dropoff_longitude) : null,
            origin_hub_id: delivery?.origin_hub_id || '',
            current_hub_id: delivery?.current_hub_id || '',
            driver_id: delivery?.driver_id || '',
            status: delivery?.status || 'pending',
            sequence_number: delivery?.sequence_number || 1,
            scheduled_at: delivery?.scheduled_at ? new Date(delivery.scheduled_at).toISOString().slice(0, 16) : '',
        },
    ];
}

/**
 * Orchestrator dialog for creating and editing deliveries.
 * Delegates rendering to CustomerInfoSection, OrderItemsSection, and LogisticsSection.
 * Business logic lives in useBillingCalculator and useDeliveryMap hooks.
 */
const DeliveryDialog = ({ open, onOpenChange, delivery, onSuccess, initialValues }: DeliveryDialogProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const createMutation = useCreateDelivery();
    const updateMutation = useUpdateDelivery();
    const isEditing = !!delivery;

    // Server data
    const { data: customersData } = useCustomers({ per_page: 100 });
    const { data: locationsData } = useLocations({ per_page: 100 });
    const { data: driversData } = useUsers({ role: 'driver', status: 'active', per_page: 100 });

    // Exchange rate resolution
    const { user } = useAuthStore();
    const { data: systemSettings } = useSystemSettings();
    const { data: companyData } = useQuery({
        queryKey: ['active-company', user?.company_id],
        queryFn: () => (user?.company_id ? companyService.getCompany(user.company_id) : null),
        enabled: !!user?.company_id,
    });

    const activeExchangeRate = useMemo(() => {
        if (companyData?.exchange_rate_mode === 'override' && companyData.exchange_rate_override_value) {
            return Number(companyData.exchange_rate_override_value);
        }
        if (systemSettings) return Number(systemSettings.exchange_rate_current_value);
        return 4000;
    }, [companyData, systemSettings]);

    // Active stop tracking
    const [activeStopIndex, setActiveStopIndex] = useState<number>(0);

    // Form
    const form = useForm({
        defaultValues: {
            customer_id: delivery?.order?.customer_id || '',
            payment_method: delivery?.order?.payment_method || 'cash',
            currency_code: delivery?.order?.currency_code || 'USD',
            order_date: delivery?.order?.order_date
                ? new Date(delivery.order.order_date).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16),
            subtotal: delivery?.order?.subtotal || 0,
            subtotal_khr: delivery?.order?.subtotal_khr || 0,
            taxable_amount: delivery?.order?.taxable_amount || 0,
            tax_percent: delivery?.order?.tax_percent || 0,
            tax_total: delivery?.order?.tax_total || 0,
            discount_type: (delivery?.order?.discount_type || '') as 'percentage' | 'fixed' | '',
            discount_value: delivery?.order?.discount_value || 0,
            discount_total: delivery?.order?.discount_total || 0,
            grand_total: delivery?.order?.grand_total || 0,
            grand_total_khr: delivery?.order?.grand_total_khr || 0,
            paid_amount: delivery?.order?.paid_amount || 0,
            balance_amount: delivery?.order?.balance_amount || 0,
            exchange_rate: delivery?.order?.exchange_rate || activeExchangeRate,
            payment_status: delivery?.order?.payment_status || 'unpaid',
            order_status: delivery?.order?.status || 'pending',
            amount_due_cod: delivery?.order?.amount_due_cod || 0,
            items: (delivery?.order?.items || [
                { product_name: '', quantity: 1, unit_price: 0 },
            ]) as FormItem[],
            stops: buildInitialStops(delivery, initialValues) as any[],
        },
        onSubmit: async ({ value }) => {
            try {
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
                        sequence_number: stop.sequence_number ? Number(stop.sequence_number) : idx + 1,
                        scheduled_at: stop.scheduled_at ? new Date(stop.scheduled_at).toISOString() : null,
                    })),
                };

                if (isEditing && delivery) {
                    await updateMutation.mutateAsync({ id: delivery.id, data: payload });
                    onOpenChange(false);
                } else {
                    const newDelivery = await createMutation.mutateAsync(payload);
                    if (onSuccess) onSuccess(newDelivery);
                    onOpenChange(false);
                }
            } catch {
                // Errors handled inside mutation hooks
            }
        },
    });

    const formValues = useStore(form.store, (state) => state.values);

    // Billing auto-calculator
    useBillingCalculator({
        formValues,
        activeExchangeRate,
        isEditing,
        setField: (name, value) => form.setFieldValue(name as any, value),
    });

    // Map state & handlers
    const { pinCoords, setPinCoords, mapViewport, setMapViewport, handleMapClick, handlePinDragEnd } =
        useDeliveryMap({
            stops: formValues.stops,
            activeStopIndex,
            setField: (name, value) => form.setFieldValue(name as any, value),
        });

    // Reset form and sync map when dialog opens
    useEffect(() => {
        if (!open) return;

        const initialStops = buildInitialStops(delivery, initialValues);

        form.reset({
            customer_id: delivery?.order?.customer_id || '',
            payment_method: delivery?.order?.payment_method || 'cash',
            currency_code: delivery?.order?.currency_code || 'USD',
            order_date: delivery?.order?.order_date
                ? new Date(delivery.order.order_date).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16),
            subtotal: delivery?.order?.subtotal || 0,
            subtotal_khr: delivery?.order?.subtotal_khr || 0,
            taxable_amount: delivery?.order?.taxable_amount || 0,
            tax_percent: delivery?.order?.tax_percent || 0,
            tax_total: delivery?.order?.tax_total || 0,
            discount_type: (delivery?.order?.discount_type || '') as 'percentage' | 'fixed' | '',
            discount_value: delivery?.order?.discount_value || 0,
            discount_total: delivery?.order?.discount_total || 0,
            grand_total: delivery?.order?.grand_total || 0,
            grand_total_khr: delivery?.order?.grand_total_khr || 0,
            paid_amount: delivery?.order?.paid_amount || 0,
            balance_amount: delivery?.order?.balance_amount || 0,
            exchange_rate: delivery?.order?.exchange_rate || activeExchangeRate,
            payment_status: delivery?.order?.payment_status || 'unpaid',
            order_status: delivery?.order?.status || 'pending',
            amount_due_cod: delivery?.order?.amount_due_cod || 0,
            items: (delivery?.order?.items || [{ product_name: '', quantity: 1, unit_price: 0 }]) as FormItem[],
            stops: initialStops as any[],
        });

        setActiveStopIndex(0);

        const firstStop = initialStops[0];
        if (firstStop?.dropoff_latitude && firstStop?.dropoff_longitude) {
            const lng = Number(firstStop.dropoff_longitude);
            const lat = Number(firstStop.dropoff_latitude);
            setPinCoords([lng, lat]);
            setMapViewport((prev: any) => ({ ...prev, center: [lng, lat], zoom: 14 }));
        } else {
            setPinCoords(null);
        }
    }, [delivery, open, activeExchangeRate, initialValues]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] xl:max-w-[1600px] h-[92vh] max-h-[92vh] gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr] overflow-hidden rounded-xl border">
                <DialogHeader className="p-5 border-b bg-background flex-shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                            <Truck className="size-5 text-primary" />
                            {isEditing
                                ? t('admin:edit_delivery') || 'Edit Delivery'
                                : t('admin:create_new_delivery') || 'Create New Delivery'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {t('admin:delivery_description_desc') ||
                                'Assign customer details, items checklist, and specify geo drop-off coordinates.'}
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

                        {/* Left Column: Order details */}
                        <div className="xl:col-span-5 flex flex-col min-h-0 border-r overflow-hidden bg-muted/5">
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-6 space-y-6">
                                    <CustomerInfoSection form={form} customersData={customersData} />
                                    <OrderItemsSection form={form} formValues={formValues} />
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right Column: Logistics & Map */}
                        <div className="xl:col-span-7 flex flex-col min-h-0 overflow-hidden bg-background">
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-6 space-y-6">
                                    <LogisticsSection
                                        form={form}
                                        formValues={formValues}
                                        activeStopIndex={activeStopIndex}
                                        setActiveStopIndex={setActiveStopIndex}
                                        mapViewport={mapViewport}
                                        setMapViewport={setMapViewport}
                                        pinCoords={pinCoords}
                                        setPinCoords={setPinCoords}
                                        handleMapClick={handleMapClick}
                                        handlePinDragEnd={handlePinDragEnd}
                                        locationsData={locationsData}
                                        driversData={driversData}
                                    />
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
                            className="min-w-[140px] font-semibold"
                        >
                            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isEditing
                                ? t('admin:save_changes') || 'Save Changes'
                                : t('admin:create_delivery') || 'Create Delivery'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DeliveryDialog;
