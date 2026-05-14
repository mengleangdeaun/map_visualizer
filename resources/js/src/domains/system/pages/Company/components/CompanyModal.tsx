import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useCreateCompany, useUpdateCompany } from '../hooks/useCompanies';
import { Company } from '../../../services/companyService';
import LogoUpload from '@/components/shared/system/LogoUpload';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Company | null;
}

const companySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    tax_id: z.string().nullable(),
    base_currency: z.string().length(3),
    telegram_user_id: z.string().nullable(),
    logo_url: z.string().nullable().superRefine((val, ctx) => {
        if (val && val.length > 100000) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Logo image is too large. Please use a smaller file.',
            });
        }
    }),
    status: z.enum(['active', 'inactive', 'suspended']),
});

const CompanyModal = ({ isOpen, onClose, initialData }: CompanyModalProps) => {
    const { t } = useTranslation('system');
    const createMutation = useCreateCompany();
    const updateMutation = useUpdateCompany();

    const isEditing = !!initialData;

    const form = useForm({
        defaultValues: {
            name: initialData?.name || '',
            slug: initialData?.slug || '',
            tax_id: initialData?.tax_id ?? null,
            base_currency: initialData?.base_currency || 'USD',
            telegram_user_id: initialData?.telegram_user_id ?? null,
            logo_url: initialData?.logo_full_url || initialData?.logo_url || null,
            status: initialData?.status || 'active',
        },
        validators: {
            onChange: companySchema,
        },
        onSubmit: async ({ value }) => {
            const formData = new FormData();
            
            // Helper to convert base64 to File
            const base64ToFile = (base64: string, filename: string) => {
                const parts = base64.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }
                return new File([uInt8Array], filename, { type: contentType });
            };

            Object.keys(value).forEach(key => {
                const val = (value as any)[key];
                if (key === 'logo_url' && (val === null || val === undefined)) {
                    // Send empty string to trigger removal in Laravel
                    formData.append('logo_url', '');
                } else if (val !== null && val !== undefined) {
                    if (key === 'logo_url' && typeof val === 'string' && val.startsWith('data:image')) {
                        // Convert compressed base64 to a real File
                        const file = base64ToFile(val, 'logo.webp');
                        formData.append('logo', file);
                    } else if (key === 'logo_url' && typeof val === 'string' && !val.startsWith('data:image')) {
                        // Keep existing logo_url if it's just a path/url
                        formData.append(key, val);
                    } else if (key !== 'logo_url') {
                        formData.append(key, val);
                    }
                }
            });

            if (isEditing && initialData) {
                updateMutation.mutate({ id: initialData.id, data: formData }, {
                    onSuccess: () => onClose()
                });
            } else {
                createMutation.mutate(formData, {
                    onSuccess: () => onClose()
                });
            }
        },
    });

    // Reset form when initialData changes or modal opens
    useEffect(() => {
        if (isOpen) {
            form.reset();
        }
    }, [isOpen, initialData]);

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px] bg-card shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary">
                        {isEditing ? t('edit_company') : t('add_new_company')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing 
                            ? t('update_the_details_of_the_organization') 
                            : t('enter_the_details_of_the_new_organization')}
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
                    <form.Field
                        name="logo_url"
                        children={(field) => (
                            <div className="flex justify-start pb-4">
                                <LogoUpload
                                    value={field.state.value ?? ''}
                                    onChange={field.handleChange}
                                    variant="square"
                                    size="lg"
                                    description="Upload your company logo. Max size 2MB."
                                />
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="name"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('company_name')}</Label>
                                    <Input 
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => {
                                            field.handleChange(e.target.value);
                                            // Auto-generate slug if it's a new company
                                            if (!isEditing) {
                                                const slug = e.target.value
                                                    .toLowerCase()
                                                    .replace(/ /g, '-')
                                                    .replace(/[^\w-]+/g, '');
                                                form.setFieldValue('slug', slug);
                                            }
                                        }}
                                        placeholder={t('enter_company_name')}
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <span className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        />

                        <form.Field
                            name="slug"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('slug')}</Label>
                                    <Input 
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="company-slug"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <span className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <form.Field
                        name="tax_id"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label>{t('tax_id')}</Label>
                                <Input 
                                    name={field.name}
                                    value={field.state.value ?? ''}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('enter_tax_id')}
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <span className="text-xs text-destructive">
                                        {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                    </span>
                                )}
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="base_currency"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('base_currency')}</Label>
                                    <Input 
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                                        placeholder="USD"
                                        maxLength={3}
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <span className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                        </span>
                                    )}
                                </div>
                        )}
                    />
                    
                    <form.Field
                        name="telegram_user_id"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('telegram_id')}</Label>
                                    <Input 
                                        name={field.name}
                                        value={field.state.value ?? ''}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="@username"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <span className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                        <form.Field
                            name="status"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('status')}</Label>
                                    <Select 
                                        value={field.state.value} 
                                        onValueChange={(value) => field.handleChange(value as 'active' | 'inactive' | 'suspended')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                                    Active
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                                                    Inactive
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="suspended">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                                    Suspended
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {field.state.meta.errors.length > 0 && (
                                        <span className="text-xs text-destructive">
                                            {field.state.meta.errors.map((error: any) => error?.message ?? error).join(', ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" size="lg" variant="ghost" onClick={handleClose}>
                            {t('cancel')}
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button 
                                    type="submit" 
                                    size="lg" 
                                    disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending || isSubmitting) 
                                        ? t('saving') + '...' 
                                        : t('save_company')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CompanyModal;
