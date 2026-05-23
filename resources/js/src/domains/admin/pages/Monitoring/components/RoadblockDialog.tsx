import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, MapPin, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoadblockTypeStyles, RoadblockType } from '@/domains/admin/utils/roadBlockType';
import { monitoringService } from '../services/monitoringService';
import { toast } from 'sonner';

const roadblockSchema = z.object({
    description: z.string().min(1, 'Description is required').max(1000, 'Description is too long'),
    type: z.enum(['blockage', 'accident', 'flood', 'traffic', 'other']),
    lat: z.number(),
    lng: z.number(),
});

interface RoadblockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: Partial<{
        lat: number | null;
        lng: number | null;
    }>;
}

const RoadblockDialog = ({ open, onOpenChange, initialValues }: RoadblockDialogProps) => {
    const { t } = useTranslation(['admin', 'system']);
    const queryClient = useQueryClient();

    // Create Roadblock Mutation
    const createMutation = useMutation({
        mutationFn: async (payload: { description: string; type: string; lat: number; lng: number }) => {
            return await monitoringService.createRoadblock(payload);
        },
        onSuccess: () => {
            toast.success("Road hazard reported successfully.");
            queryClient.invalidateQueries({ queryKey: ['admin', 'road-alerts'] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to report roadblock.");
        }
    });

    const validateField = (name: string, value: any) => {
        const result = roadblockSchema.safeParse({ ...form.state.values, [name]: value });
        if (!result.success) {
            const error = result.error.issues.find(issue => issue.path.includes(name));
            return error ? error.message : undefined;
        }
        return undefined;
    };

    const form = useForm({
        defaultValues: {
            description: '',
            type: 'blockage' as RoadblockType,
            lat: initialValues?.lat || 0,
            lng: initialValues?.lng || 0,
        },
        onSubmit: async ({ value }) => {
            await createMutation.mutateAsync(value);
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                description: '',
                type: 'blockage' as RoadblockType,
                lat: initialValues?.lat || 0,
                lng: initialValues?.lng || 0,
            });
        }
    }, [open, initialValues]);

    const isSubmitting = createMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background shadow-2xl rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="p-5 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-destructive/10 rounded-xl text-destructive animate-pulse">
                            <AlertTriangle className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {t('admin:report_roadblock', 'Report Roadblock')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                {t('admin:report_roadblock_desc', 'Broadcast a real-time hazard pin to alert all drivers in this region.')}
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
                    className="flex flex-col gap-4 p-5"
                >
                    {/* Geolocation Coordinate Snapshot banner */}
                    <div className="bg-muted/40 border border-dashed rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-destructive" />
                            <span>Lat: <span className="font-mono text-foreground">{form.getFieldValue('lat')?.toFixed(6)}</span></span>
                        </div>
                        <div className="h-4 w-[1px] bg-border" />
                        <div className="flex items-center gap-2">
                            <Globe className="size-3.5 text-primary" />
                            <span>Lng: <span className="font-mono text-foreground">{form.getFieldValue('lng')?.toFixed(6)}</span></span>
                        </div>
                    </div>

                    {/* Hazard Type Select Field */}
                    <form.Field
                        name="type"
                        children={(field) => (
                            <div className="space-y-1.5">
                                <Label htmlFor={field.name} className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                                    {t('admin:hazard_type', 'Hazard Alert Type')}
                                </Label>
                                <Select
                                    value={field.state.value}
                                    onValueChange={(val: any) => field.handleChange(val)}
                                >
                                    <SelectTrigger className="w-full h-11 rounded-xl bg-background border px-3 text-sm focus:ring-1 focus:ring-primary font-medium text-foreground">
                                        <SelectValue placeholder={t('admin:select_type', 'Select Type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blockage">Road Blocked / Closed</SelectItem>
                                        <SelectItem value="accident">Traffic Accident</SelectItem>
                                        <SelectItem value="flood">Severe Flooding</SelectItem>
                                        <SelectItem value="traffic">Severe Traffic Jam</SelectItem>
                                        <SelectItem value="other">Other Hazard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />

                    {/* Hazard Description Text Area Field */}
                    <form.Field
                        name="description"
                        validators={{ onChange: ({ value }) => validateField('description', value) }}
                        children={(field) => (
                            <div className="space-y-1.5">
                                <Label htmlFor={field.name} className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                                    {t('admin:hazard_description', 'Alert Description')}
                                </Label>
                                <Textarea
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Enter roadblock details (e.g. tree fell down, deep water)..."
                                    className="min-h-[100px] text-sm rounded-xl p-3 bg-background resize-none focus-visible:ring-1 focus-visible:ring-primary"
                                    maxLength={1000}
                                />
                                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive font-semibold">
                                        {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    {/* Dialog Footer Actions */}
                    <DialogFooter className="border-t pt-4 mt-2 flex sm:justify-end items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="rounded-xl h-10 px-5 text-sm font-semibold"
                        >
                            {t('admin:cancel', 'Cancel')}
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isFormSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting || isFormSubmitting}
                                    className="rounded-xl h-10 px-6 text-sm font-semibold bg-destructive hover:bg-destructive/90 text-white shadow-md"
                                >
                                    {(isSubmitting || isFormSubmitting) && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    {t('admin:publish_warning', 'Publish Warning')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RoadblockDialog;
