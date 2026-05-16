import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Task } from '@/domains/admin/pages/Tasks/services/taskService';
import { useCreateTask, useUpdateTask } from '@/domains/admin/pages/Tasks/hooks/useTasks';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ClipboardList, User, MapPin, Phone, Calendar, Info, Truck, Plus, Navigation, Check, ChevronsUpDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useVehicles } from '@/domains/admin/hooks/useVehicles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useHubs } from '@/domains/admin/hooks/useHubs';
import { parseGoogleMapsUrl } from '@/lib/maps';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DateTimePicker } from '@/components/shared/system/DateTimePicker';

const taskSchema = z.object({
    title: z.string().min(1, 'field_required'),
    vehicle_id: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'archived']),
    contact_name: z.string().nullable().optional(),
    contact_phone: z.string().nullable().optional(),
    pickup_address: z.string().nullable().optional(),
    dropoff_address: z.string().nullable().optional(),
    pickup_lat: z.number().nullable().optional(),
    pickup_lng: z.number().nullable().optional(),
    dropoff_lat: z.number().nullable().optional(),
    dropoff_lng: z.number().nullable().optional(),
    scheduled_at: z.string().nullable().optional(),
});

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: Task | null;
    initialValues?: Partial<{
        pickup_lat: number | null;
        pickup_lng: number | null;
        dropoff_lat: number | null;
        dropoff_lng: number | null;
        pickup_address: string;
        dropoff_address: string;
    }>;
}

/**
 * HubSelector Component - Stabilized outside TaskDialog
 */
const HubSelector = ({ onSelect, label, hubs, t }: { onSelect: (hub: any) => void, label: string, hubs: any[], t: any }) => {
    const [openSelector, setOpenSelector] = useState(false);
    
    return (
        <Popover open={openSelector} onOpenChange={setOpenSelector}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2">
                    <Plus className="size-3" />
                    {label}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                    <CommandInput placeholder={t('search_hubs','Search Hubs...')} />
                    <CommandList>
                        <CommandEmpty>{t('no_hubs_found','No hubs found.')}</CommandEmpty>
                        <CommandGroup>
                            {hubs.map((hub: any) => (
                                <CommandItem
                                    key={hub.id}
                                    value={hub.name + hub.id}
                                    onSelect={() => {
                                        onSelect(hub);
                                        setOpenSelector(false);
                                    }}
                                    className="flex flex-col items-start gap-0.5"
                                >
                                    <span className="font-bold text-sm">{hub.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{hub.address}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const TaskDialog = ({ open, onOpenChange, task, initialValues }: TaskDialogProps) => {
    const { t } = useTranslation('admin');
    const { data: vehiclesData, isLoading: isLoadingVehicles } = useVehicles();
    const { data: hubsData } = useHubs();
    const createMutation = useCreateTask();
    const updateMutation = useUpdateTask();

    const isEditing = !!task;

    const hubs = hubsData?.data || [];

    const form = useForm({
        defaultValues: {
            title: task?.title || '',
            vehicle_id: task?.vehicle_id || null,
            description: task?.description || '',
            status: task?.status || 'assigned',
            contact_name: task?.contact_name || '',
            contact_phone: task?.contact_phone || '',
            pickup_address: task?.pickup_address || initialValues?.pickup_address || '',
            dropoff_address: task?.dropoff_address || initialValues?.dropoff_address || '',
            pickup_lat: task?.pickup_lat || initialValues?.pickup_lat || null,
            pickup_lng: task?.pickup_lng || initialValues?.pickup_lng || null,
            dropoff_lat: task?.dropoff_lat || initialValues?.dropoff_lat || null,
            dropoff_lng: task?.dropoff_lng || initialValues?.dropoff_lng || null,
            scheduled_at: task?.scheduled_at || null,
        },
        onSubmit: async ({ value }) => {
            try {
                // Sanitize coordinates before submission
                const sanitizedValue = {
                    ...value,
                    pickup_lat: sanitizeCoord(value.pickup_lat),
                    pickup_lng: sanitizeCoord(value.pickup_lng),
                    dropoff_lat: sanitizeCoord(value.dropoff_lat),
                    dropoff_lng: sanitizeCoord(value.dropoff_lng),
                };

                if (isEditing) {
                    await updateMutation.mutateAsync({ id: task.id, data: sanitizedValue as any });
                } else {
                    await createMutation.mutateAsync(sanitizedValue as any);
                }
                onOpenChange(false);
            } catch (error) {}
        },
    });

    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, task, initialValues]);

    const handleAddressPaste = (e: React.ClipboardEvent, fieldName: 'pickup' | 'dropoff') => {
        const text = e.clipboardData.getData('text');
        
        // Clean up text if it contains POINT(...) wrapper
        let cleanText = text;
        if (typeof text === 'string' && text.includes('POINT')) {
            const match = text.match(/\(([^)]+)\)/);
            if (match) {
                const parts = match[1].split(' ');
                if (parts.length === 2) {
                    // WKT is POINT(lng lat), but we might just want to parse the URL
                    // If it's already a WKT, we don't necessarily want to parse it as a URL
                }
            }
        }

        const coords = parseGoogleMapsUrl(cleanText);
        if (coords) {
            e.preventDefault();
            const optimizedAddress = coords.address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            
            // Strictly update ONLY the target fields
            form.setFieldValue(`${fieldName}_address` as any, optimizedAddress);
            form.setFieldValue(`${fieldName}_lat` as any, coords.lat);
            form.setFieldValue(`${fieldName}_lng` as any, coords.lng);
        }
    };

    /**
     * Sanitizes coordinate input to ensure only numeric values are sent
     */
    const sanitizeCoord = (val: any): number | null => {
        if (val === null || val === undefined || val === '') return null;
        
        // If it's already a number, return it
        if (typeof val === 'number') return isNaN(val) ? null : val;
        
        // If it's a string, try to extract numbers
        if (typeof val === 'string') {
            // Remove POINT() wrapper if present
            if (val.includes('POINT')) {
                const match = val.match(/-?\d+\.\d+/g);
                if (match) {
                    // Usually WKT is POINT(lng lat), but our lat/lng fields expect individual numbers
                    // This is tricky because we don't know if the string was Lat or Lng
                    // Best to just parse as a single float if it's a simple string
                    return parseFloat(val.replace(/[^\d.-]/g, ''));
                }
            }
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        }
        
        return null;
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] h-fit gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr] overflow-hidden">
                <DialogHeader className="p-4 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ClipboardList className="size-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-primary">
                                {isEditing ? t('edit_task') || 'Edit Task' : t('create_new_task') || 'Create New Task'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? t('update_task_details') : t('assign_new_fleet_task')}
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
                    className="flex flex-col min-h-0 overflow-hidden"
                >
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 space-y-4">

                            <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <ClipboardList size={12} className="text-primary" />
                                    {t('task_details','Task Details')}
                                </Label>
                                <form.Field
                                    name="title"
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>{t('title') || 'Task Title'}</Label>
                                            <Input
                                                id={field.name}
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Delivery to Riverside..."
                                                className="bg-background"
                                            />
                                        </div>
                                    )}
                                />
                                <form.Field
                                    name="description"
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>{t('description')}</Label>
                                            <Input
                                                id={field.name}
                                                value={field.state.value || ''}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Special instructions..."
                                                className="bg-background"
                                            />
                                        </div>
                                    )}
                                />
                                <form.Field
                                    name="scheduled_at"
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>{t('scheduled_at') || 'Schedule At'}</Label>
                                            <DateTimePicker
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                placeholder={t('select_schedule_time', 'Select schedule time')}
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <User size={12} className="text-primary" />
                                    {t('contact_information','Contact Information')}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field
                                        name="contact_name"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label>{t('contact_name') || 'Contact Name'}</Label>
                                                <Input
                                                    value={field.state.value || ''}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="e.g. John Doe"
                                                    className="bg-background"
                                                />
                                            </div>
                                        )}
                                    />
                                    <form.Field
                                        name="contact_phone"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label>{t('contact_phone') || 'Contact Phone'}</Label>
                                                <Input
                                                    value={field.state.value || ''}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="099-XXX-XXX"
                                                    className="bg-background"
                                                />
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <MapPin size={12} className="text-primary" />
                                    {t('location_details','Location Details')}
                                </Label>
                                
                                {/* Pickup Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            {t('pickup_address') || 'Pickup Address'}
                                            {sanitizeCoord(form.getFieldValue('pickup_lat')) !== null && (
                                                <Badge variant="secondary" className="h-4 text-[8px] bg-green-500/10 text-green-600 border-green-500/20 px-1 font-black">
                                                    GPS FIXED
                                                </Badge>
                                            )}
                                        </Label>
                                        <HubSelector 
                                            label={t('from_hub','From Hub')} 
                                            hubs={hubs}
                                            t={t}
                                            onSelect={(hub) => {
                                                const lat = sanitizeCoord(hub.latitude);
                                                const lng = sanitizeCoord(hub.longitude);
                                                
                                                form.setFieldValue('pickup_address', hub.address || hub.name);
                                                form.setFieldValue('pickup_lat', lat);
                                                form.setFieldValue('pickup_lng', lng);
                                            }}
                                        />
                                    </div>
                                    <form.Field
                                        name="pickup_address"
                                        children={(field) => (
                                            <div className="relative">
                                                <Input
                                                    value={field.state.value || ''}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onPaste={(e) => handleAddressPaste(e, 'pickup')}
                                                    placeholder={t('paste_link_desc','Paste Google Maps link...')}
                                                    className="bg-background text-xs pr-10"
                                                />
                                                <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    />
                                </div>

                                {/* Dropoff Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            {t('dropoff_address') || 'Drop-off Address'}
                                            {sanitizeCoord(form.getFieldValue('dropoff_lat')) !== null && (
                                                <Badge variant="secondary" className="h-4 text-[8px] bg-green-500/10 text-green-600 border-green-500/20 px-1 font-black">
                                                    GPS FIXED
                                                </Badge>
                                            )}
                                        </Label>
                                        <HubSelector 
                                            label={t('to_hub','To Hub')} 
                                            hubs={hubs}
                                            t={t}
                                            onSelect={(hub) => {
                                                const lat = sanitizeCoord(hub.latitude);
                                                const lng = sanitizeCoord(hub.longitude);
                                                
                                                form.setFieldValue('dropoff_address', hub.address || hub.name);
                                                form.setFieldValue('dropoff_lat', lat);
                                                form.setFieldValue('dropoff_lng', lng);
                                            }}
                                        />
                                    </div>
                                    <form.Field
                                        name="dropoff_address"
                                        children={(field) => (
                                            <div className="relative">
                                                <Input
                                                    value={field.state.value || ''}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onPaste={(e) => handleAddressPaste(e, 'dropoff')}
                                                    placeholder={t('paste_link_desc','Paste Google Maps link...')}
                                                    className="bg-background text-xs pr-10"
                                                />
                                                <Navigation size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Truck size={12} className="text-primary" />
                                    {t('dispatching','Dispatching')}
                                </Label>
                                <form.Field
                                    name="vehicle_id"
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label>{t('assign_vehicle') || 'Assign Vehicle'}</Label>
                                            <SearchableSelect
                                                options={vehiclesData?.data || []}
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                isLoading={isLoadingVehicles}
                                                placeholder={t('select_vehicle')}
                                                getOptionValue={(v) => v.id}
                                                getOptionLabel={(v) => v.plate_number}
                                                renderOption={(v) => (
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                                                                <Truck size={12} />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{v.plate_number}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{v.type}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t bg-muted/5 flex-shrink-0 flex sm:justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            {isEditing && task?.status !== 'completed' && task?.status !== 'cancelled' && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="lg"
                                    onClick={() => {
                                        if (confirm(t('confirm_cancel_task', 'Are you sure you want to cancel this task?'))) {
                                            form.setFieldValue('status', 'cancelled');
                                            form.handleSubmit();
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {t('cancel_task', 'Cancel Task')}
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
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
                                        {isEditing ? t('update_task') || 'Update Task' : t('create_task') || 'Create Task'}
                                    </Button>
                                )}
                            />
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>

        </Dialog>
    );
};

export default TaskDialog;
