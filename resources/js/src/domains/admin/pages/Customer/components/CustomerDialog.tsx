import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
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
import { useCreateCustomer, useUpdateCustomer } from '../../../hooks/useCustomers';
import { Customer } from '../../../services/customerService';
import { Loader2 } from 'lucide-react';

interface CustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: Customer;
    onSuccess?: (customer: Customer) => void;
}

const CustomerDialog = ({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) => {
    const { t } = useTranslation('admin');
    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    const isEditing = !!customer;

    const form = useForm({
        defaultValues: {
            name: customer?.name || "",
            phone: customer?.phone || "",
            email: customer?.email || "",
            default_address: customer?.default_address || "",
        },
        onSubmit: async ({ value }) => {
            try {
                if (isEditing && customer) {
                    await updateMutation.mutateAsync({
                        id: customer.id,
                        data: value,
                    });
                    onOpenChange(false);
                } else {
                    const newCustomer = await createMutation.mutateAsync(value);
                    if (onSuccess) onSuccess(newCustomer);
                    onOpenChange(false);
                }
            } catch (error) {
                // Error handled by mutation
            }
        },
    });

    // Reset form when customer changes or dialog opens
    React.useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [customer, open]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] grid grid-rows-[auto_1fr_auto] max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle>
                        {isEditing ? t('edit_customer') || 'Edit Customer' : t('add_new_customer') || 'Add New Customer'}
                    </DialogTitle>
                    <DialogDescription>
                        {t('customer_details_desc') || 'Enter the details for this customer.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 overflow-y-auto">
                    <form 
                        id="customer-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <form.Field
                            name="name"
                            validators={{
                                onChange: z.string().min(2, "Name must be at least 2 characters")
                            }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('customer_name') || 'Customer Name'}</Label>
                                    <Input 
                                        id={field.name}
                                        placeholder="John Doe" 
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    {field.state.meta.errors.length > 0 ? (
                                        <p className="text-[10px] font-medium text-destructive">
                                            {field.state.meta.errors.map(err => typeof err === 'object' ? (err as any)?.message : err).join(", ")}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        />

                        <form.Field
                            name="phone"
                            validators={{
                                onChange: z.string().min(8, "Phone number must be at least 8 digits")
                            }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('phone_number') || 'Phone Number'}</Label>
                                    <Input 
                                        id={field.name}
                                        placeholder="012 345 678" 
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    {field.state.meta.errors.length > 0 ? (
                                        <p className="text-[10px] font-medium text-destructive">
                                            {field.state.meta.errors.map(err => typeof err === 'object' ? (err as any)?.message : err).join(", ")}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        />

                        <form.Field
                            name="email"
                            validators={{
                                onChange: z.string().email().or(z.literal(''))
                            }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('email') || 'Email (Optional)'}</Label>
                                    <Input 
                                        id={field.name}
                                        placeholder="john@example.com" 
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    {field.state.meta.errors.length > 0 ? (
                                        <p className="text-[10px] font-medium text-destructive">
                                            {field.state.meta.errors.map(err => typeof err === 'object' ? (err as any)?.message : err).join(", ")}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        />

                        <form.Field
                            name="default_address"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('address') || 'Address'}</Label>
                                    <Textarea 
                                        id={field.name}
                                        placeholder={t('customer_address_placeholder') || 'Building, Street, Area...'} 
                                        className="min-h-[100px] resize-none"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </div>
                            )}
                        />
                    </form>
                </div>

                <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('cancel') || 'Cancel'}
                    </Button>
                    <Button 
                        type="submit" 
                        form="customer-form"
                        disabled={isLoading}
                        className="min-w-[120px]"
                    >
                        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {isEditing ? t('save_changes') : t('create_customer')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerDialog;
