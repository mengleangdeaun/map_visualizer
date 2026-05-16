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
import { Loader2, Truck, Weight, Box, Tag, Activity, ShieldCheck, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDrivers } from '../../../../hooks/useDrivers';
import { User } from '../../../../../system/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

const vehicleSchema = z.object({
    type: z.enum(['motorcycle', 'tuktuk', 'minivan', 'box_truck']),
    plate_number: z.string().min(1, 'field_required').max(20),
    max_weight_kg: z.number().nullable().or(z.string().transform(v => v === '' ? null : Number(v))),
    max_volume_cbm: z.number().nullable().or(z.string().transform(v => v === '' ? null : Number(v))),
    max_speed_kmh: z.number().min(10).max(200).or(z.string().transform(v => v === '' ? 60 : Number(v))),
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
            max_speed_kmh: vehicle?.max_speed_kmh || 60,
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
            // Trigger validation after reset to update canSubmit state
            setTimeout(() => form.validate('change'), 0);
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] h-fit gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr] overflow-hidden">
                <DialogHeader className="p-4 border-b bg-background flex-shrink-0 ">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Truck className="size-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-primary">
                                {isEditing ? t('edit_vehicle') : t('add_new_vehicle') || 'Add New Vehicle'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? t('update_vehicle_details') || 'Update the details of the vehicle.' : t('enter_vehicle_details') || 'Enter the details of the new vehicle to add it to your fleet.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }} 
                    className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 space-y-4">
                            <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Tag size={12} className="text-primary" />
                            {t('vehicle_info','Vehicle Information')}
                        </Label>
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
                                            <SelectTrigger className="bg-background">
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
                                            className="font-mono uppercase bg-background"
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive">
                                                {field.state.meta.errors.map((error: any) => error).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <ShieldCheck size={12} className="text-primary" />
                            {t('specifications','Specifications')}
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="max_weight_kg"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>
                                            {t('max_weight_kg') || 'Max Weight (kg)'}
                                        </Label>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="1000"
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            />

                            <form.Field
                                name="max_volume_cbm"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>
                                            {t('max_volume_cbm') || 'Max Volume (cbm)'}
                                        </Label>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            step="0.01"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="5.5"
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>
 
                    <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 space-y-4">
                        <Label className="text-[10px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-2">
                            <ShieldCheck size={12} className="text-red-500" />
                            {t('safety_policy','Safety Policy')}
                        </Label>
                        <form.Field
                            name="max_speed_kmh"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name} className="flex items-center justify-between">
                                        <span>{t('max_speed_limit') || 'Max Speed Limit (km/h)'}</span>
                                        <span className="text-[10px] font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                                            {field.state.value} km/h
                                        </span>
                                    </Label>
                                    <Input
                                        id={field.name}
                                        type="number"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="60"
                                        className="bg-background border-red-500/20 focus-visible:ring-red-500/30"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        {t('speed_limit_desc', 'Admins will be notified immediately if the driver exceeds this speed.')}
                                    </p>
                                </div>
                            )}
                        />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <UserPlus size={12} className="text-primary" />
                            {t('assignment','Assignment')}
                        </Label>
                        <form.Field
                            name="driver_id"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('assign_driver', 'Assign Driver')}</Label>
                                    <SearchableSelect
                                        options={drivers || []}
                                        value={field.state.value}
                                        onChange={field.handleChange}
                                        isLoading={isLoadingDrivers}
                                        placeholder={t('select_driver')}
                                        searchPlaceholder={t('search_driver_name_or_phone','Search name or phone...')}
                                        getOptionValue={(d) => d.id}
                                        getOptionLabel={(d) => d.name}
                                        getOptionSearchTerms={(d) => [d.name, d.phone, d.email || '']}
                                        triggerClassName="min-h-[4rem]"
                                        renderTrigger={(selectedDriver) => (
                                            <div className="flex items-center gap-3 text-left w-full">
                                                <Avatar className="h-10 w-10 border-border/40 shadow-sm flex-shrink-0">
                                                    <AvatarImage src={selectedDriver.profile_full_url || ''} />
                                                    <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                                                        <UserIcon size={12} />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-1 items-center justify-between min-w-0">
                                                    <span className="text-xs font-bold truncate">{selectedDriver.name}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded-md border border-border/30 font-mono">
                                                        {selectedDriver.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        renderOption={(driver) => (
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
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
                                        )}
                                    />
                                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                        <p className="text-xs text-destructive mt-1 font-medium px-1">
                                            {field.state.meta.errors.map((error: any) => t(`system:${error?.message ?? error}`)).join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Activity size={12} className="text-primary" />
                            {t('status','Status')}
                        </Label>
                        <form.Field
                            name="is_active"
                            children={(field) => (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold cursor-pointer" htmlFor="is_active_switch">{t('active_status') || 'Active Status'}</Label>
                                        <p className="text-[10px] text-muted-foreground">{t('active_status_desc') || 'Enable or disable this vehicle from the fleet.'}</p>
                                    </div>
                                    <Switch
                                        id="is_active_switch"
                                        checked={field.state.value}
                                        onCheckedChange={field.handleChange}
                                    />
                                </div>
                            )}
                        />
                    </div>
                </div>
            </ScrollArea>
 
            <DialogFooter className="p-4 border-t bg-muted/5 flex-shrink-0">
                <Button
                    size='lg'
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                >
                    {t('cancel')}
                </Button>
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button 
                            size='lg'
                            type="submit"
                            className='px-8' 
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
