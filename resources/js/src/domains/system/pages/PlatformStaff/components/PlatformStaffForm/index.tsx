import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useField } from '@tanstack/react-form';
import { z } from 'zod';
import { User } from '../../../../services/userService';
import { useCreateUser, useUpdateUser } from '../../../User/hooks/useUsers';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LogoUpload from '@/components/shared/system/LogoUpload';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const getStaffSchema = (isEditing: boolean) => z.object({
    role: z.enum(['super_admin', 'system_staff']),
    name: z.string().min(1, 'field_required'),
    phone: z.string().min(1, 'field_required'),
    email: z.string().email().min(1, 'field_required'),
    password: isEditing 
        ? z.string().min(8, 'password_min_length').or(z.literal(''))
        : z.string().min(1, 'field_required').min(8, 'password_min_length'),
    status: z.enum(['active', 'suspended', 'inactive']),
    profile_url: z.string().nullable(),
    permissions: z.record(z.string(), z.boolean()).optional(),
});

interface PlatformStaffFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User;
}

const PlatformStaffForm = ({ open, onOpenChange, user }: PlatformStaffFormProps) => {
    const { t } = useTranslation('system');
    
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const isEditing = !!user;

    const form = useForm({
        defaultValues: {
            company_id: '', // Platform staff has no company
            role: (user?.role || 'system_staff') as 'super_admin' | 'system_staff',
            name: user?.name || '',
            phone: user?.phone || '',
            email: user?.email || '',
            password: '',
            status: (user?.status || 'active') as 'active' | 'suspended' | 'inactive',
            profile_url: user?.profile_full_url || user?.profile_url || null,
            permissions: (user?.permissions as Record<string, boolean>) || {
                manage_all_companies: false,
                access_billing: false,
                edit_system_settings: false,
                manage_platform_users: false,
            },
        },
        onSubmit: async ({ value }) => {
            const formData = new FormData();
            
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

            Object.entries(value).forEach(([key, val]) => {
                if (key === 'profile_url' && (val === null || val === undefined)) {
                    if (isEditing) formData.append('profile_url', '');
                } else if (val !== null && val !== undefined && val !== '') {
                    if (key === 'profile_url' && typeof val === 'string' && val.startsWith('data:image')) {
                        const file = base64ToFile(val, 'profile.webp');
                        formData.append('profile', file);
                    } else if (key === 'profile_url' && typeof val === 'string' && !val.startsWith('data:image')) {
                        formData.append(key, val);
                    } else if (key === 'permissions') {
                        formData.append(key, JSON.stringify(val));
                    } else {
                        formData.append(key, val as string);
                    }
                }
            });

            // Ensure company_id is explicitly null/empty for platform staff
            formData.set('company_id', '');

            try {
                if (isEditing) {
                    await updateMutation.mutateAsync({ id: user.id, data: formData });
                } else {
                    await createMutation.mutateAsync(formData);
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
    }, [open, user]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const validateField = (name: string, value: any) => {
        const schema = getStaffSchema(isEditing);
        const result = schema.safeParse({ ...form.state.values, [name]: value });
        if (!result.success) {
            const error = result.error.issues.find(issue => issue.path.includes(name));
            return error ? t(error.message) : undefined;
        }
        return undefined;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ShieldCheck className="size-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-primary">
                                {isEditing ? t('edit_platform_staff') || 'Edit Platform Staff' : t('add_platform_staff') || 'Add Platform Staff'}
                            </DialogTitle>
                            <DialogDescription>
                                {t('manage_internal_platform_team_members')}
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
                    <div className="flex gap-8">
                        <form.Field
                            name="profile_url"
                            children={(field) => (
                                <div className="flex-shrink-0">
                                    <LogoUpload
                                        variant="circle"
                                        value={field.state.value ?? ''}
                                        onChange={field.handleChange}
                                        label={t('profile_picture')}
                                    />
                                </div>
                            )}
                        />
                        
                        <div className="flex-1 space-y-4">
                            <form.Field
                                name="name"
                                validators={{ onChange: ({ value }) => validateField('name', value) }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('full_name') || 'Full Name'}</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder={t('enter_full_name')}
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <form.Field
                                    name="email"
                                    validators={{ onChange: ({ value }) => validateField('email', value) }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>{t('email')}</Label>
                                            <Input
                                                id={field.name}
                                                type="email"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="admin@mapcn.com"
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    )}
                                />
                                <form.Field
                                    name="phone"
                                    validators={{ onChange: ({ value }) => validateField('phone', value) }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>{t('phone')}</Label>
                                            <Input
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder={t('phone')}
                                            />
                                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                                <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Lock size={12} className="text-primary" />
                            {t('security_role','Security & Role')}
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="role"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('system_role') || 'System Role'}</Label>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val: any) => field.handleChange(val)}
                                        >
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="super_admin">{t('role_super_admin')}</SelectItem>
                                                <SelectItem value="system_staff">{t('role_system_staff')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            />

                            <form.Field
                                name="password"
                                validators={{ onChange: ({ value }) => validateField('password', value) }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name} className="flex items-center gap-2">
                                            {t('password')}
                                            {isEditing && (
                                                <span className="text-[10px] text-muted-foreground font-normal italic">
                                                    ({t('leave_blank_to_keep_current', 'Leave Blank')})
                                                </span>
                                            )}
                                        </Label>
                                        <Input
                                            id={field.name}
                                            type="password"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder={isEditing ? '••••••••' : t('enter_password')}
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <div className="bg-accent/5 p-4 rounded-xl border space-y-4">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={12} className="text-primary" />
                            {t('platform_permissions','Platform Permissions')}
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'manage_all_companies', label: t('manage_all_companies','Manage All Companies') },
                                { key: 'access_billing', label: t('access_billing','Access Billing & Plans') },
                                { key: 'edit_system_settings', label: t('edit_system_settings') || 'Edit System Settings' },
                                { key: 'manage_platform_users', label: t('manage_platform_users') || 'Manage Platform Team' },
                            ].map((perm) => (
                                <form.Field
                                    key={perm.key}
                                    name={`permissions.${perm.key}`}
                                    children={(field) => (
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors shadow-sm">
                                            <span className="text-xs font-semibold text-foreground/80">{perm.label}</span>
                                            <Switch
                                                checked={field.state.value as boolean}
                                                onCheckedChange={field.handleChange}
                                            />
                                        </div>
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            size="lg"
                            type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            {t('cancel')}
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button 
                                    size="lg"
                                    type="submit" 
                                    className="px-8 shadow-lg shadow-primary/20"
                                    disabled={!canSubmit || isLoading || isSubmitting}
                                >
                                    {(isLoading || isSubmitting) ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                    )}
                                    {t('save_staff_member') || 'Save Staff Member'}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PlatformStaffForm;
