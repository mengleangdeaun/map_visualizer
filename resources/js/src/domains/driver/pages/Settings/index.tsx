import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '../../store/useHeaderStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
    useUpdateProfilePicture,
    useRequestEmailChange,
    useConfirmEmailChange,
    useChangePassword,
    useSavePushSubscription,
    useDeletePushSubscription 
} from '../../hooks/useDriverSettings';
import { 
    Camera, 
    Mail, 
    Lock, 
    Bell, 
    Check, 
    KeyRound, 
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';

const DriverSettings = () => {
    const { t } = useTranslation(['driver', 'system']);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const setHeader = useHeaderStore(s => s.setHeader);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [emailVal, setEmailVal] = useState(user?.email || '');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);
    const [simulatedCode, setSimulatedCode] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [pushEnabled, setPushEnabled] = useState(() => {
        const localPref = localStorage.getItem('mapcn_push_enabled');
        if (localPref !== null) {
            return localPref === 'true';
        }
        return 'Notification' in window && Notification.permission === 'granted';
    });

    // Mutations
    const updatePictureMutation = useUpdateProfilePicture();
    const requestEmailMutation = useRequestEmailChange();
    const confirmEmailMutation = useConfirmEmailChange();
    const changePasswordMutation = useChangePassword();
    const savePushMutation = useSavePushSubscription();
    const deletePushMutation = useDeletePushSubscription();

    useEffect(() => {
        setHeader({
            title: t('driver:settings') || 'Settings',
            showBackButton: true,
            backTarget: '/driver/profile'
        });
        return () => setHeader({});
    }, [setHeader, t]);

    // Handle avatar file selection
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updatePictureMutation.mutate(file);
        }
    };

    // Request email verification
    const handleRequestEmailChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailVal || emailVal === user?.email) return;

        requestEmailMutation.mutate(emailVal, {
            onSuccess: (data) => {
                setIsEmailVerificationSent(true);
                setSimulatedCode(data.code); // Display demo code for verification simulation ease
            }
        });
    };

    // Confirm email verification code
    const handleConfirmEmailChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationCode) return;

        confirmEmailMutation.mutate(verificationCode, {
            onSuccess: () => {
                setIsEmailVerificationSent(false);
                setVerificationCode('');
                setSimulatedCode('');
            }
        });
    };

    // Password change handler
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return;

        changePasswordMutation.mutate({ currentPass: currentPassword, newPass: newPassword }, {
            onSuccess: () => {
                setCurrentPassword('');
                setNewPassword('');
            }
        });
    };

    // Push subscription handler
    const handlePushToggle = async (checked: boolean) => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            alert('Push notifications are not supported on this browser/device.');
            return;
        }

        if (checked) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setPushEnabled(true);
                localStorage.setItem('mapcn_push_enabled', 'true');
                // Simulate PWA registration with standard payload details
                savePushMutation.mutate({
                    endpoint: 'https://updates.mapcn.com/push/sub/' + user?.id,
                    public_key: 'BIP69342784523789456237894562789456278945627894562378945627894562789',
                    auth_token: 'A1B2C3D4E5F6G7H8I9J0',
                    device_type: 'desktop'
                });
            } else {
                setPushEnabled(false);
                localStorage.setItem('mapcn_push_enabled', 'false');
            }
        } else {
            setPushEnabled(false);
            localStorage.setItem('mapcn_push_enabled', 'false');
            // Unsubscribe from database
            deletePushMutation.mutate('https://updates.mapcn.com/push/sub/' + user?.id);
        }
    };

    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';

    const handleRefresh = async () => {
        // Simulate refreshing settings states
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
    };

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="p-4 flex flex-col gap-6 max-w-md mx-auto animate-in fade-in duration-500 pb-24">
            
            {/* Profile Avatar Editor */}
            <Card className="p-5 flex flex-col items-center gap-3.5 bg-card/60 backdrop-blur-xl rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="size-24 border-4 border-background shadow-lg relative">
                        {user?.profile_full_url ? (
                            <AvatarImage src={user.profile_full_url} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Camera Overlay Trigger */}
                    <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Camera className="text-white size-6" />
                    </div>

                    {updatePictureMutation.isPending && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <RefreshCw className="text-white size-6 animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col text-center">
                    <span className="text-xs font-bold text-muted-foreground">
                        {t('driver:tap_to_change_picture') || 'Tap to edit profile picture'}
                    </span>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </Card>

            {/* Email Edit Block */}
            <Card className="p-5 flex flex-col gap-4 bg-card/60 backdrop-blur-xl rounded-2xl">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Mail size={18} className="text-primary" />
                    <span className="text-sm font-black tracking-tight">{t('driver:change_email') || 'Email Address'}</span>
                </div>

                {!isEmailVerificationSent ? (
                    <form onSubmit={handleRequestEmailChange} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email-input" className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                {t('driver:email') || 'Email Address'}
                            </Label>
                            <Input 
                                id="email-input" 
                                type="email"
                                value={emailVal}
                                onChange={(e) => setEmailVal(e.target.value)}
                                placeholder="driver@mapcn.com"
                                className="rounded-xl border bg-background/50 h-10 px-3.5 text-xs font-bold"
                            />
                        </div>

                        <Button 
                            type="submit"
                            size="sm"
                            disabled={emailVal === user?.email || requestEmailMutation.isPending}
                            className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-10 mt-1"
                        >
                            {requestEmailMutation.isPending 
                                ? t('driver:sending_code') || 'Sending Code...' 
                                : t('driver:request_email_code') || 'Send Verification Code'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirmEmailChange} className="flex flex-col gap-4 animate-in fade-in slide-in-from-top duration-300">
                        {/* Simulation Helper Banner */}
                        {simulatedCode && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl flex items-center gap-2 text-[11px] font-bold leading-normal">
                                <AlertCircle size={14} className="shrink-0" />
                                <div>
                                    <span className="font-black uppercase tracking-wider">{t('driver:simulation_code') || 'Demo Verification Code: '}</span>
                                    <span className="font-mono text-sm font-black bg-amber-500/25 px-1.5 py-0.5 rounded ml-1 tracking-wider">{simulatedCode}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="code-input" className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                {t('driver:verification_code') || '6-Digit Verification Code'}
                            </Label>
                            <Input 
                                id="code-input" 
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="rounded-xl border bg-background/50 h-10 px-3.5 text-xs font-bold tracking-widest text-center font-mono"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                type="button"
                                variant="outline"
                                onClick={() => setIsEmailVerificationSent(false)}
                                className="w-1/2 font-black uppercase tracking-wider rounded-xl py-4 h-10"
                            >
                                {t('driver:back') || 'Back'}
                            </Button>
                            <Button 
                                type="submit"
                                disabled={verificationCode.length !== 6 || confirmEmailMutation.isPending}
                                className="w-1/2 font-black uppercase tracking-wider rounded-xl py-4 h-10 bg-primary hover:bg-primary/95"
                            >
                                {confirmEmailMutation.isPending 
                                    ? t('driver:verifying') || 'Verifying...' 
                                    : t('driver:verify') || 'Verify'}
                            </Button>
                        </div>
                    </form>
                )}
            </Card>

            {/* Password Reset Block */}
            <Card className="p-5 flex flex-col gap-4 bg-card/60 backdrop-blur-xl rounded-2xl">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Lock size={18} className="text-primary" />
                    <span className="text-sm font-black tracking-tight">{t('driver:reset_password') || 'Reset Password'}</span>
                </div>

                <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="current-pass" className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                            {t('driver:current_password') || 'Current Password'}
                        </Label>
                        <Input 
                            id="current-pass" 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="rounded-xl border bg-background/50 h-10 px-3.5 text-xs font-bold"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="new-pass" className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                            {t('driver:new_password') || 'New Password'}
                        </Label>
                        <Input 
                            id="new-pass" 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            className="rounded-xl border bg-background/50 h-10 px-3.5 text-xs font-bold"
                        />
                    </div>

                    <Button 
                        type="submit"
                        disabled={!currentPassword || newPassword.length < 8 || changePasswordMutation.isPending}
                        className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-10 mt-1"
                    >
                        {changePasswordMutation.isPending 
                            ? t('driver:updating_password') || 'Updating...' 
                            : t('driver:update_password') || 'Update Password'}
                    </Button>
                </form>
            </Card>

            {/* VAPID Push Notification Settings */}
            <Card className="p-5 flex flex-col gap-4 bg-card/60 backdrop-blur-xl rounded-2xl">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Bell size={18} className="text-primary" />
                    <span className="text-sm font-black tracking-tight">{t('driver:push_notifications') || 'Push Notifications'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl">
                    <div className="flex flex-col pr-4 min-w-0">
                        <span className="text-xs font-black tracking-tight leading-none mb-1.5">
                            {t('driver:enable_vapid_pushes') || 'VAPID Push Service'}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground leading-normal">
                            {t('driver:push_desc') || 'Receive task assignments and shift alerts directly on this device.'}
                        </span>
                    </div>

                    <Switch 
                        checked={pushEnabled}
                        onCheckedChange={handlePushToggle}
                        disabled={savePushMutation.isPending || deletePushMutation.isPending}
                    />
                </div>
            </Card>

        </div>
        </PullToRefresh>
    );
};

export default DriverSettings;
