import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Vehicle } from '../../../../services/vehicleService';
import { useCreateVehicle, useUpdateVehicle } from '../../../../hooks/useVehicles';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useDrivers } from '../../../../hooks/useDrivers';
import { User } from '../../../../../system/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

const vehicleSchema = z.object({
    type: z.enum(['motorcycle', 'tuktuk', 'minivan', 'box_truck']),
    plate_number: z.string().min(1, 'field_required').max(20),
    max_weight_kg: z.number().nullable().or(z.string().transform(v => v === '' ? null : Number(v))),
    max_volume_cbm: z.number().nullable().or(z.string().transform(v => v === '' ? null : Number(v))),
    is_active: z.boolean(),
    driver_id: z.string().nullable().optional(),
});

interface VehicleFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicle?: Vehicle;
}

const VehicleForm = ({ open, onOpenChange, vehicle }: VehicleFormProps) => {
    const { t } = useTranslation('admin');
    const { data: drivers, isLoading: isLoadingDrivers } = useDrivers();
    const createMutation = useCreateVehicle();
    const updateMutation = useUpdateVehicle();

    const isEditing = !!vehicle;

    const form = useForm({
        defaultValues: {
            type: vehicle?.type || 'motorcycle',
            plate_number: vehicle?.plate_number || '',
            max_weight_kg: vehicle?.max_weight_kg || '',
            max_volume_cbm: vehicle?.max_volume_cbm || '',
            is_active: vehicle?.is_active ?? true,
            driver_id: vehicle?.driver_id || null,
        },
        onSubmit: async ({ value }) => {
            try {
                if (isEditing) {
                    await updateMutation.mutateAsync({ id: vehicle.id, data: value as any });
                } else {
                    await createMutation.mutateAsync(value as any);
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
    }, [open, vehicle]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const validateField = (name: string, value: any) => {
        const result = vehicleSchema.safeParse({ ...form.state.values, [name]: value });
        if (!result.success) {
            const error = result.error.issues.find(issue => issue.path.includes(name));
            return error ? t(error.message) : undefined;
        }
        return undefined;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-card shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                        <Truck className="size-5" />
                        {isEditing ? t('edit_vehicle') : t('add_new_vehicle') || 'Add New Vehicle'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? t('update_vehicle_details') || 'Update the details of the vehicle.' : t('enter_vehicle_details') || 'Enter the details of the new vehicle to add it to your fleet.'}
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
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="type"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('type') || 'Vehicle Type'}</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(val: any) => field.handleChange(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select_type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="motorcycle">{t('type_motorcycle')}</SelectItem>
                                            <SelectItem value="tuktuk">{t('type_tuktuk')}</SelectItem>
                                            <SelectItem value="minivan">{t('type_minivan')}</SelectItem>
                                            <SelectItem value="box_truck">{t('type_box_truck')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />

                        <form.Field
                            name="plate_number"
                            validators={{
                                onChange: ({ value }) => validateField('plate_number', value)
                            }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('plate_number')}</Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="AB-1234"
                                        className="font-mono uppercase"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <p className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => error).join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="max_weight_kg"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('max_weight_kg') || 'Max Weight (kg)'}</Label>
                                    <Input
                                        id={field.name}
                                        type="number"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="1000"
                                    />
                                </div>
                            )}
                        />

                        <form.Field
                            name="max_volume_cbm"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('max_volume_cbm') || 'Max Volume (cbm)'}</Label>
                                    <Input
                                        id={field.name}
                                        type="number"
                                        step="0.01"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="5.5"
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <form.Field
                        name="driver_id"
                        children={(field) => {
                            const selectedDriver = drivers?.find(d => d.id === field.state.value);
                            return (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('assign_driver', 'Assign Driver')}</Label>
                                    <Select
                                        value={field.state.value || "none"}
                                        onValueChange={(val: any) => field.handleChange(val === "none" ? null : val)}
                                        disabled={isLoadingDrivers}
                                    >
                                        <SelectTrigger className="h-12 bg-background border-border/50 shadow-sm transition-all hover:border-primary/30">
                                            <SelectValue placeholder={isLoadingDrivers ? t('loading_drivers') : t('select_driver')}>
                                                {selectedDriver ? (
                                                    <div className="flex items-center gap-2 text-left">
                                                        <Avatar className="h-7 w-7 border-border/40 shadow-sm">
                                                            <AvatarImage src={selectedDriver.profile_full_url || ''} />
                                                            <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                                                                <UserIcon size={12} />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-xs font-bold truncate">{selectedDriver.name}</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/30 px-1 rounded-sm border border-border/30">
                                                                {selectedDriver.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            <SelectItem value="none" className="text-muted-foreground font-medium">
                                                {t('unassigned', 'Unassigned')}
                                            </SelectItem>
                                            {drivers?.map((driver: User) => (
                                                <SelectItem key={driver.id} value={driver.id} className="py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                                                            <AvatarImage src={driver.profile_full_url || ''} />
                                                            <AvatarFallback className="text-xs bg-primary/5 text-primary font-black uppercase">
                                                                {driver.name.substring(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm leading-tight text-foreground/90">{driver.name}</span>
                                                                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/40 font-mono">
                                                                    {driver.phone}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                                {driver.email || t('system:no_email_address')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {field.state.meta.errors.length > 0 && (
                                        <p className="text-xs text-destructive mt-1 font-medium px-1">
                                            {field.state.meta.errors.map((error: any) => t(`system:${error?.message ?? error}`)).join(', ')}
                                        </p>
                                    )}
                                </div>
                            );
                        }}
                    />

                    <form.Field
                        name="is_active"
                        children={(field) => (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold">{t('active_status') || 'Active Status'}</Label>
                                    <p className="text-[10px] text-muted-foreground">{t('active_status_desc') || 'Enable or disable this vehicle from the fleet.'}</p>
                                </div>
                                <Switch
                                    checked={field.state.value}
                                    onCheckedChange={field.handleChange}
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
                                    {t('save_vehicle') || 'Save Vehicle'}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleForm;
