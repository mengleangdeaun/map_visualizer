import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Location } from '../../../../../fleet/services/locationService';
import { useCreateLocation, useUpdateLocation } from '../../hooks/useLocations';
import { useCompanies } from '../../../../pages/Company/hooks/useCompanies';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Loader2, 
    MapPin, 
    Fingerprint, 
    Layers, 
    Globe, 
    ClipboardPaste, 
    Building2,
    Activity
} from 'lucide-react';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

const locationSchema = z.object({
    company_id: z.string().min(1, 'field_required'),
    code: z.string().or(z.literal('')),
    name: z.string().min(1, 'field_required'),
    type: z.enum(['main_sort', 'regional_hub', 'local_node']),
    latitude: z.number(),
    longitude: z.number(),
});

interface LocationFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    location?: Location;
}

const LocationForm = ({ open, onOpenChange, location }: LocationFormProps) => {
    const { t } = useTranslation('system');
    
    const { data: companiesData } = useCompanies(1, 100);
    
    const createMutation = useCreateLocation();
    const updateMutation = useUpdateLocation();

    const isEditing = !!location;

    const form = useForm({
        defaultValues: {
            company_id: location?.company_id || '',
            code: location?.code || '',
            name: location?.name || '',
            type: (location?.type || 'local_node') as 'main_sort' | 'regional_hub' | 'local_node',
            latitude: Number(location?.latitude ?? 0),
            longitude: Number(location?.longitude ?? 0),
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
        // Regex to match lat/lng with optional comma or space
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
                company_id: location.company_id,
                code: location.code || '',
                name: location.name,
                type: location.type,
                latitude: Number(location.latitude ?? 0),
                longitude: Number(location.longitude ?? 0),
            } : {
                company_id: '',
                code: '',
                name: '',
                type: 'local_node',
                latitude: 0,
                longitude: 0,
            });
            // Trigger validation after reset to update canSubmit state
            setTimeout(() => form.validate('change'), 0);
        }
    }, [open, location]);

    const validateField = (name: string, value: any) => {
        const result = locationSchema.safeParse({ ...form.state.values, [name]: value });
        if (!result.success) {
            const error = result.error.issues.find(issue => issue.path.includes(name));
            return error ? t(error.message) : undefined;
        }
        return undefined;
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
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
                                {t('manage_logistics_hubs_and_sorting_centers')}
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
                    className="space-y-4 pt-4"
                >
                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Fingerprint size={12} className="text-primary" />
                            {t('hub_information','Hub Information')}
                        </Label>

                        <form.Field
                            name="company_id"
                            validators={{ onChange: ({ value }) => validateField('company_id', value) }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('company')}</Label>
                                    <SearchableSelect
                                        options={companiesData?.data || []}
                                        value={field.state.value}
                                        onChange={(val) => field.handleChange(val || '')}
                                        isLoading={!companiesData}
                                        placeholder={t('select_company')}
                                        searchPlaceholder={t('search_company','Search organization...')}
                                        getOptionValue={(c) => c.id}
                                        getOptionLabel={(c) => c.name}
                                    />
                                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                        <p className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => t(error?.message ?? error)).join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        />

                        <form.Field
                            name="name"
                            validators={{ onChange: ({ value }) => validateField('name', value) }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>{t('hub_name')}</Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t('hub_name')}
                                        className="bg-background"
                                    />
                                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                        <p className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => t(error?.message ?? error)).join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="code"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('hub_code')}</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="HUB-001"
                                            className="bg-background font-mono uppercase"
                                        />
                                    </div>
                                )}
                            />

                            <form.Field
                                name="type"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('hub_type')}</Label>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val: any) => field.handleChange(val)}
                                        >
                                            <SelectTrigger className="bg-background text-xs">
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
                    </div>

                    <div className="bg-accent/5 p-4 rounded-xl border space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Globe size={12} className="text-primary" />
                            {t('geography','Geography')}
                        </Label>
                        
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold">
                                <ClipboardPaste size={12} />
                                {t('quick_paste_coordinates')}
                            </Label>
                            <Input
                                placeholder="11.5564, 104.9282"
                                className="h-8 text-xs bg-background border-dashed focus-visible:ring-primary/20"
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
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            placeholder="11.5564"
                                            className="bg-background font-mono"
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
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            placeholder="104.9282"
                                            className="bg-background font-mono"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

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

export default LocationForm;
