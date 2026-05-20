import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { DocumentNumberSetting } from '../../../services/documentNumberingService';
import { useCreateDocumentNumberSetting, useUpdateDocumentNumberSetting } from '../../../hooks/useDocumentNumbering';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings, Hash, Calendar, Layers, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

const documentNumberingSchema = z.object({
    name: z.string().min(1, 'field_required').max(255),
    prefix: z.string().max(50).nullable().or(z.literal('')),
    suffix: z.string().max(50).nullable().or(z.literal('')),
    date_format: z.enum(['None', 'YYYY', 'YY', 'YYYYMM', 'YYYYMMDD']),
    separator: z.enum(['None', '-', '/', '_']).nullable().or(z.literal('')),
    digit_padding: z.number().min(1).max(10).or(z.string().transform(v => v === '' ? 5 : Number(v))),
    next_number: z.number().min(1).or(z.string().transform(v => v === '' ? 1 : Number(v))),
    reset_frequency: z.enum(['None', 'Daily', 'Monthly', 'Yearly']),
    sequence_scope: z.enum(['order', 'tracking', 'task']),
    template: z.string().min(1, 'field_required').max(255),
    is_active: z.boolean(),
});

interface DocumentNumberingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    setting?: DocumentNumberSetting;
}

const DocumentNumberingDialog = ({ open, onOpenChange, setting }: DocumentNumberingDialogProps) => {
    const { t } = useTranslation('admin');
    const createMutation = useCreateDocumentNumberSetting();
    const updateMutation = useUpdateDocumentNumberSetting();

    const isEditing = !!setting;

    const form = useForm({
        defaultValues: {
            name: setting?.name || '',
            prefix: setting?.prefix || '',
            suffix: setting?.suffix || '',
            date_format: setting?.date_format || 'YYYY',
            separator: setting?.separator || '-',
            digit_padding: setting?.digit_padding || 5,
            next_number: setting?.next_number || 1,
            reset_frequency: setting?.reset_frequency || 'None',
            sequence_scope: (setting?.sequence_scope as 'order' | 'tracking' | 'task') || 'order',
            template: setting?.template || '{PREFIX}{SEPARATOR}{YYYY}{SEPARATOR}{SEQ}',
            is_active: setting?.is_active ?? true,
        },
        onSubmit: async ({ value }) => {
            try {
                if (isEditing) {
                    await updateMutation.mutateAsync({ id: setting.id, data: value as any });
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
            setTimeout(() => form.validate('change'), 0);
        }
    }, [open, setting]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const validateField = (name: string, value: any) => {
        const result = documentNumberingSchema.safeParse({ ...form.state.values, [name]: value });
        if (!result.success) {
            const error = result.error.issues.find(issue => issue.path.includes(name));
            return error ? t(error.message) : undefined;
        }
        return undefined;
    };

    // Client-side live preview generation
    const generatePreview = (values: typeof form.state.values) => {
        const now = new Date();
        const pad = (num: number, size: number) => {
            let s = num + "";
            while (s.length < size) s = "0" + s;
            return s;
        };
        
        const seq = pad(Number(values.next_number) || 1, Number(values.digit_padding) || 5);
        const separator = values.separator === 'None' ? '' : (values.separator || '');
        
        const replacements: Record<string, string> = {
            '{PREFIX}': values.prefix || '',
            '{SUFFIX}': values.suffix || '',
            '{YYYY}': now.getFullYear().toString(),
            '{YY}': now.getFullYear().toString().slice(-2),
            '{MM}': pad(now.getMonth() + 1, 2),
            '{DD}': pad(now.getDate(), 2),
            '{SEQ}': seq,
            '{SEPARATOR}': separator,
            '{SEP}': separator,
        };

        let formatted = values.template || '{PREFIX}{SEPARATOR}{YYYY}{SEPARATOR}{SEQ}';
        Object.entries(replacements).forEach(([key, val]) => {
            formatted = formatted.replace(new RegExp(key, 'g'), val);
        });

        return formatted;
    };

    // Reactively compute the preview
    const previewValue = generatePreview(form.state.values);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] h-fit gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr] overflow-hidden">
                <DialogHeader className="p-4 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="size-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-primary">
                                {isEditing ? t('edit_numbering_config', 'Edit Document Numbering') : t('add_numbering_config', 'Add Numbering Configuration')}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? t('edit_numbering_desc', 'Modify settings for generating dynamic serial numbers.') : t('add_numbering_desc', 'Set prefix, separator, suffix, and sequence scope parameters.')}
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
                            
                            {/* Live Preview Card */}
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20 space-y-2 shadow-sm transition-all duration-300">
                                <Label className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Eye size={12} className="text-primary" />
                                    {t('live_preview', 'Live Sequence Preview')}
                                </Label>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-lg font-black text-primary tracking-wider break-all drop-shadow-sm select-all">
                                        {previewValue}
                                    </span>
                                    <span className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase border border-primary/20 font-sans">
                                        {form.state.values.sequence_scope || 'scope'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/80 leading-normal">
                                    {t('preview_instruction', 'Shows next generated value based on current configuration and system date.')}
                                </p>
                            </div>

                            {/* Configuration Info */}
                            <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Layers size={12} className="text-primary" />
                                    {t('general_settings', 'General Configuration')}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field
                                        name="name"
                                        validators={{
                                            onChange: ({ value }) => validateField('name', value)
                                        }}
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('config_name', 'Configuration Name')}</Label>
                                                <Input
                                                    id={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder={t('invoice_numbering', 'Invoice Numbering')}
                                                    className="bg-background"
                                                />
                                                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                                    <p className="text-xs text-destructive">
                                                        {field.state.meta.errors.map((error: any) => error).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    />

                                    <form.Field
                                        name="sequence_scope"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('document_type_scope', 'Sequence Scope')}</Label>
                                                <Select
                                                    value={field.state.value}
                                                    onValueChange={(val: any) => field.handleChange(val)}
                                                >
                                                    <SelectTrigger className="bg-background capitalize">
                                                        <SelectValue placeholder={t('select_scope', 'Select Scope')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="order">{t('scope_order', 'Order Number')}</SelectItem>
                                                        <SelectItem value="tracking">{t('scope_tracking', 'Delivery Tracking Number')}</SelectItem>
                                                        <SelectItem value="task">{t('scope_task', 'Task Tracking Number')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Format & Template Parameters */}
                            <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Calendar size={12} className="text-primary" />
                                    {t('format_parameters', 'Format Parameters')}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field
                                        name="prefix"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('prefix', 'Prefix')}</Label>
                                                <Input
                                                    id={field.name}
                                                    value={field.state.value || ''}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="INV"
                                                    className="bg-background uppercase"
                                                />
                                            </div>
                                        )}
                                    />

                                    <form.Field
                                        name="suffix"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('suffix', 'Suffix')}</Label>
                                                <Input
                                                    id={field.name}
                                                    value={field.state.value || ''}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="CAM"
                                                    className="bg-background uppercase"
                                                />
                                            </div>
                                        )}
                                    />

                                    <form.Field
                                        name="date_format"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('date_format', 'Date Format')}</Label>
                                                <Select
                                                    value={field.state.value}
                                                    onValueChange={(val: any) => field.handleChange(val)}
                                                >
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder={t('select_date_format', 'Select Format')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">{t('none', 'None (Disable date)')}</SelectItem>
                                                        <SelectItem value="YYYY">YYYY (e.g. 2026)</SelectItem>
                                                        <SelectItem value="YY">YY (e.g. 26)</SelectItem>
                                                        <SelectItem value="YYYYMM">YYYYMM (e.g. 202605)</SelectItem>
                                                        <SelectItem value="YYYYMMDD">YYYYMMDD (e.g. 20260520)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />

                                    <form.Field
                                        name="separator"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('separator', 'Separator')}</Label>
                                                <Select
                                                    value={field.state.value || 'None'}
                                                    onValueChange={(val: any) => field.handleChange(val === 'None' ? '' : val)}
                                                >
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder={t('select_separator', 'Select Separator')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">{t('none', 'None')}</SelectItem>
                                                        <SelectItem value="-">Hyphen (-)</SelectItem>
                                                        <SelectItem value="/">Slash (/)</SelectItem>
                                                        <SelectItem value="_">Underscore (_)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Counter Controls */}
                            <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Hash size={12} className="text-primary" />
                                    {t('sequence_counter', 'Sequence Counter & Frequency')}
                                </Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <form.Field
                                        name="digit_padding"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('digit_padding', 'Digit Padding')}</Label>
                                                <Input
                                                    id={field.name}
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                                    placeholder="5"
                                                    className="bg-background"
                                                />
                                            </div>
                                        )}
                                    />

                                    <form.Field
                                        name="next_number"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('next_number', 'Next Number')}</Label>
                                                <Input
                                                    id={field.name}
                                                    type="number"
                                                    min="1"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                                    placeholder="1"
                                                    className="bg-background font-mono"
                                                />
                                            </div>
                                        )}
                                    />

                                    <form.Field
                                        name="reset_frequency"
                                        children={(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>{t('reset_frequency', 'Reset Schedule')}</Label>
                                                <Select
                                                    value={field.state.value}
                                                    onValueChange={(val: any) => field.handleChange(val)}
                                                >
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder={t('select_reset_frequency', 'Select Schedule')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">{t('none', 'Never Reset')}</SelectItem>
                                                        <SelectItem value="Daily">{t('daily', 'Daily Reset')}</SelectItem>
                                                        <SelectItem value="Monthly">{t('monthly', 'Monthly Reset')}</SelectItem>
                                                        <SelectItem value="Yearly">{t('yearly', 'Yearly Reset')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Template Schema Form Field */}
                            <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Settings size={12} className="text-primary" />
                                    {t('schema_template', 'Sequence Template Format')}
                                </Label>
                                <form.Field
                                    name="template"
                                    validators={{
                                        onChange: ({ value }) => validateField('template', value)
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>{t('template_format', 'Template Schema')}</Label>
                                            <Input
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="{PREFIX}{SEPARATOR}{YYYY}{SEPARATOR}{SEQ}"
                                                className="font-mono bg-background focus:ring-primary/20"
                                            />
                                            <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                                                {t('template_desc', 'Use tokens: {PREFIX}, {SUFFIX}, {YYYY}, {YY}, {MM}, {DD}, {SEQ}, {SEPARATOR}')}
                                            </p>
                                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                                <p className="text-xs text-destructive">
                                                    {field.state.meta.errors.map((error: any) => error).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Toggle Active Status */}
                            <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                                <form.Field
                                    name="is_active"
                                    children={(field) => (
                                        <div className="flex items-center justify-between p-1 bg-transparent">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold cursor-pointer" htmlFor="is_active_numbering">{t('active_status', 'Active Status')}</Label>
                                                <p className="text-[10px] text-muted-foreground">{t('active_status_numbering_desc', 'Enable or disable this configuration rule.')}</p>
                                            </div>
                                            <Switch
                                                id="is_active_numbering"
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
                                    {t('save_config', 'Save Config')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentNumberingDialog;
