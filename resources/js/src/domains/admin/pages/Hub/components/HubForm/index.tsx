import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Location } from '@/domains/fleet/services/locationService';
import { useCreateAdminHub, useUpdateAdminHub } from '../../hooks/useAdminHubs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, ShieldCheck, Info } from 'lucide-react';

const hubSchema = z.object({
    code: z.string().or(z.literal('')),
    name: z.string().min(1, 'field_required'),
    type: z.enum(['main_sort', 'regional_hub', 'local_node']),
    latitude: z.number(),
    longitude: z.number(),
});

interface HubFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    location?: Location;
}

const HubForm = ({ open, onOpenChange, location }: HubFormProps) => {
    const { t } = useTranslation(['admin', 'system']);
    
    const createMutation = useCreateAdminHub();
    const updateMutation = useUpdateAdminHub();

    const isEditing = !!location;

    const form = useForm({
        defaultValues: {
            code: location?.code || '',
            name: location?.name || '',
            type: (location?.type || 'local_node') as 'main_sort' | 'regional_hub' | 'local_node',
            latitude: Number(location?.latitude ?? 0),
            longitude: Number(location?.longitude ?? 0),
        },
        validators: {
            onChange: hubSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                if (isEditing) {
                    await updateMutation.mutateAsync({ id: location.id, data: value });
                } else {
                    await createMutation.mutateAsync(value);
                }
                onOpenChange(false);
            } catch (error) {
                // Handled in mutation hook
            }
        },
    });

    const handlePaste = (value: string) => {
        if (!value) return;
        const match = value.match(/(-?\d+\.?\d*)[,\s]+\s*(-?\d+\.?\d*)/);
        if (match) {
            const lat = Number(match[1]);
            const lng = Number(match[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
                form.setFieldValue('latitude', lat);
                form.setFieldValue('longitude', lng);
            }
        }
    };

    useEffect(() => {
        if (open) {
            form.reset(location ? {
                code: location.code || '',
                name: location.name,
                type: location.type,
                latitude: Number(location.latitude ?? 0),
                longitude: Number(location.longitude ?? 0),
            } : {
                code: '',
                name: '',
                type: 'local_node',
                latitude: 0,
                longitude: 0,
            });
        }
    }, [open, location]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-card shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MapPin className="size-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-primary">
                                {isEditing ? t('edit_hub') : t('add_new_hub')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('manage_logistics_hubs_and_centers')}
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
                    className="space-y-6 pt-4"
                >
                    <div className="bg-accent/5 p-4 rounded-xl border space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Info size={12} className="text-primary" />
                            {t('system:info') || 'Information'}
                        </Label>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="name"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('hub_name')}</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder={t('hub_name')}
                                            className="bg-background"
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive">
                                                {field.state.meta.errors.map((error: any) => t(`system:${error?.message ?? error}`)).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="code"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('hub_code')}</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="HUB-001"
                                            className="bg-background uppercase"
                                        />
                                    </div>
                                )}
                            />
                        </div>

                        <form.Field
                            name="type"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('hub_type')}</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(val: any) => field.handleChange(val)}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder={t('select_type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="main_sort">{t('type_main_sort')}</SelectItem>
                                            <SelectItem value="regional_hub">{t('type_regional_hub')}</SelectItem>
                                            <SelectItem value="local_node">{t('type_local_node')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={12} className="text-primary" />
                            {t('system:coordinates') || 'Coordinates'}
                        </Label>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground italic">
                                {t('quick_paste_coordinates')}
                            </Label>
                            <Input
                                placeholder="11.5564, 104.9282"
                                className="h-8 text-xs bg-background border-dashed"
                                onChange={(e) => handlePaste(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="latitude"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('latitude')}</Label>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            step="0.0000001"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            placeholder="11.5564"
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            />

                            <form.Field
                                name="longitude"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('longitude')}</Label>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            step="0.0000001"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            placeholder="104.9282"
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button 
                            size="lg"
                            type="button" 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                        >
                            {t('system:cancel')}
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button 
                                    size="lg"
                                    type="submit" 
                                    className="px-8"
                                    disabled={!canSubmit || isLoading || isSubmitting}
                                >
                                    {(isLoading || isSubmitting) ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    {t('save_hub')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default HubForm;
