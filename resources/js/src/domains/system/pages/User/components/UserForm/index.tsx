import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useField } from '@tanstack/react-form';
import { z } from 'zod';
import { User } from '../../../../services/userService';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useCompanies } from '../../../../pages/Company/hooks/useCompanies';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LogoUpload from '@/components/shared/system/LogoUpload';
import { Loader2, ShieldCheck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useLocations } from '../../../Location/hooks/useLocations';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

const getUserSchema = (isEditing: boolean, isPlatformStaff?: boolean) => z.object({
    company_id: isPlatformStaff ? z.string().optional() : z.string().min(1, 'field_required'),
    role: z.string().min(1, 'field_required'),
    name: z.string().min(1, 'field_required'),
    phone: z.string().min(1, 'field_required'),
    email: z.string().email().or(z.literal('')),
    password: isEditing 
        ? z.string().refine(val => val === '' || val.length >= 8, { message: 'password_min_length' })
        : z.string().min(1, 'field_required').min(8, 'password_min_length'),
    status: z.enum(['active', 'suspended', 'inactive']),
    telegram_user_id: z.string().or(z.literal('')),
    base_hub_id: z.string().or(z.literal('')),
    profile_url: z.string().nullable(),
    permissions: z.record(z.string(), z.boolean()).optional(),
});

interface UserFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User;
    isPlatformStaff?: boolean;
}

const UserForm = ({ open, onOpenChange, user, isPlatformStaff }: UserFormProps) => {
    const { t } = useTranslation('system');
    
    const { data: companiesData } = useCompanies(1, 100);
    
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const isEditing = !!user;
    const isSuperAdminBeingEdited = user?.role === 'super_admin' || user?.role === 'system_staff';
    const showPlatformRoles = isPlatformStaff || isSuperAdminBeingEdited;

    const form = useForm({
        defaultValues: {
            company_id: user?.company_id || '',
            role: (user?.role || (showPlatformRoles ? 'super_admin' : 'admin')) as string,
            name: user?.name || '',
            phone: user?.phone || '',
            email: user?.email || '',
            password: '',
            status: (user?.status || 'active') as 'active' | 'suspended' | 'inactive',
            telegram_user_id: user?.telegram_user_id || '',
            base_hub_id: user?.base_hub_id || '',
            profile_url: user?.profile_full_url || user?.profile_url || null,
            permissions: (user?.permissions as Record<string, boolean>) || {},
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
                    } else if (key !== 'profile_url') {
                        formData.append(key, val as string);
                    }
                }
            });

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
        }
    });

    // Get companyId reactively for hub fetching
    const companyIdField = useField({ form, name: 'company_id' });
    const companyId = companyIdField.state.value;
    
    const { data: hubsData, isLoading: isLoadingHubs } = useLocations({ 
        company_id: companyId,
        per_page: 100 
    });

    useEffect(() => {
        if (open) {
            form.reset(user ? {
                company_id: user.company_id || '',
                role: user.role as string,
                name: user.name || '',
                phone: user.phone || '',
                email: user.email || '',
                password: '',
                status: (user.status || 'active') as 'active' | 'suspended' | 'inactive',
                telegram_user_id: user.telegram_user_id || '',
                base_hub_id: user.base_hub_id || '',
                profile_url: user.profile_full_url || user.profile_url || null,
                permissions: (user.permissions as Record<string, boolean>) || {},
            } : {
                company_id: '',
                role: showPlatformRoles ? 'super_admin' : 'admin',
                name: '',
                phone: '',
                email: '',
                password: '',
                status: 'active',
                telegram_user_id: '',
                base_hub_id: '',
                profile_url: null,
                permissions: {},
            });

            // Trigger validation after reset to update canSubmit state
            setTimeout(() => form.validate('change'), 0);
        }
    }, [open, user, showPlatformRoles]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const validateField = (name: string, value: any) => {
        const currentValues = { ...form.state.values, [name]: value };
        const dynamicIsPlatformStaff = isPlatformStaff || (currentValues.role === 'super_admin' || currentValues.role === 'system_staff');
        const schema = getUserSchema(isEditing, dynamicIsPlatformStaff);
        const result = schema.safeParse(currentValues);
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
                                {isEditing ? t('edit_user') : t('add_new_user')}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing ? t('update_the_details_of_the_user') : t('enter_the_details_of_the_new_user')}
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
                                        size="md"
                                        variant="square"
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
                                        <Label htmlFor={field.name}>{t('full_name','Full Name')}</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder={t('enter_full_name','Enter Full Name')}
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
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="user@example.com"
                                            />
                                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                                <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                                            )}
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
                            <MapPin size={12} className="text-primary" />
                            {t('organization_location','Organization & Location')}
                        </Label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="company_id"
                                validators={{ onChange: ({ value }) => validateField('company_id', value) }}
                                children={(field) => (
                                    <div className="flex-1 w-full space-y-2">
                                        <Label htmlFor={field.name}>{t('company')}</Label>
                                        <SearchableSelect
                                            options={companiesData?.data || []}
                                            value={field.state.value}
                                            onChange={(val) => {
                                                field.handleChange(val || '');
                                                form.setFieldValue('base_hub_id', '');
                                            }}
                                            isLoading={!companiesData}
                                            placeholder={t('select_company')}
                                            searchPlaceholder={t('search_company','Search organization...')}
                                            getOptionValue={(c) => c.id}
                                            getOptionLabel={(c) => c.name}
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="base_hub_id"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('base_hub','Base Hub')}</Label>
                                        <SearchableSelect
                                            options={hubsData?.data || []}
                                            value={field.state.value}
                                            onChange={(val) => field.handleChange(val || '')}
                                            isLoading={isLoadingHubs}
                                            disabled={!companyId}
                                            placeholder={!companyId ? t('select_company_first') : t('select_hub')}
                                            searchPlaceholder={t('search_hub','Search hub...')}
                                            getOptionValue={(h) => h.id}
                                            getOptionLabel={(h) => h.name}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-accent/5 p-4 rounded-xl border">
                        <div className="space-y-4">
                            <form.Field
                                name="role"
                                validators={{ onChange: ({ value }) => validateField('role', value) }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>
                                            {t('role')}
                                        </Label>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val: any) => field.handleChange(val)}
                                        >
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">{t('role_admin')}</SelectItem>
                                                <SelectItem value="dispatcher">{t('role_dispatcher')}</SelectItem>
                                                <SelectItem value="hub_operator">{t('role_hub_operator')}</SelectItem>
                                                <SelectItem value="driver">{t('role_driver')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="status"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('status')}</Label>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val: any) => field.handleChange(val)}
                                        >
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">{t('status_active')}</SelectItem>
                                                <SelectItem value="suspended">{t('status_suspended')}</SelectItem>
                                                <SelectItem value="inactive">{t('status_inactive')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <form.Field
                                name="password"
                                validators={{ onChange: ({ value }) => validateField('password', value) }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name} className="flex items-center gap-2">
                                            {t('password')}
                                            {isEditing && (
                                                <span className="text-[10px] text-muted-foreground font-normal italic">
                                                    ({t('leave_blank_to_keep_current', 'Leave Blank to keep current')})
                                                </span>
                                            )}
                                        </Label>
                                        <Input
                                            id={field.name}
                                            type="password"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-background"
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="telegram_user_id"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>{t('telegram_id') || 'Telegram ID'}</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="@username"
                                            className="bg-background"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            size="lg"
                                            type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                            {t('cancel')}
                                        </Button>
                                        <Button 
                                            size="lg"
                                            type="submit" 
                                            className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            disabled={!canSubmit || isLoading || isSubmitting}
                                        >
                                            {isLoading || isSubmitting ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                            )}
                                            {isEditing ? t('save_changes') : t('create_user')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UserForm;
