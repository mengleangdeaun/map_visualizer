import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useActiveShift, useCheckOutVehicle } from '../../hooks/useDriverShift';
import { useHeaderStore } from '../../store/useHeaderStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { 
    User as UserIcon, 
    Building2, 
    Truck, 
    Languages, 
    LogOut, 
    Navigation, 
    ShieldCheck, 
    Calendar,
    Globe,
    ChevronRight,
    Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';

const DriverProfile = () => {
    const { t, i18n } = useTranslation(['driver', 'system']);
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const setHeader = useHeaderStore(s => s.setHeader);

    // Shift info & checkout action
    const { data: activeShiftData, isLoading: isActiveShiftLoading, refetch } = useActiveShift();
    const checkOutMutation = useCheckOutVehicle();
    
    const activeVehicle = activeShiftData?.vehicle || null;
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);

    useEffect(() => {
        setHeader({
            title: t('driver:my_profile') || 'My Profile',
            showBackButton: true,
            backTarget: '/driver',
            rightAction: (
                <Link to="/driver/settings" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <SettingsIcon size={20} />
                </Link>
            )
        });
        return () => setHeader({});
    }, [setHeader, t]);

    const handleSignOut = () => {
        setIsSignOutOpen(true);
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleConfirmSignOut = () => {
        setIsSignOutOpen(false);
        clearAuth();
        toast.success(t('driver:logged_out_success') || 'Signed out successfully');
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        navigate({ to: '/auth/login' });
    };

    const handleCheckOut = () => {
        checkOutMutation.mutate();
    };

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        toast.success(t('driver:language_changed') || `Language changed to ${lang.toUpperCase()}`);
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
    };

    // User initials for Avatar fallback
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';

    return (
        <PullToRefresh onRefresh={async () => { await refetch(); }}>
            <div className="p-4 flex flex-col gap-6 max-w-md mx-auto animate-in fade-in duration-500 pb-24">
            
            {/* User Profile Info Card */}
            <Card className="p-5 flex flex-col gap-4 items-center text-center relative overflow-hidden bg-card/60 backdrop-blur-xl shadow-lg shadow-primary/5 rounded-2xl">
                {/* Background Accent Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <Avatar className="size-20 border-2 border-primary/20 shadow-md">
                    {user?.profile_full_url ? (
                        <AvatarImage src={user.profile_full_url} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/5 text-primary text-xl font-black">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-1 z-10">
                    <h2 className="text-lg font-black tracking-tight leading-none text-foreground">{user?.name}</h2>
                    <span className="text-[11px] font-bold text-muted-foreground">{user?.email || 'No email registered'}</span>
                    
                    <div className="flex items-center gap-1.5 justify-center mt-2">
                        <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full tracking-widest flex items-center gap-1">
                            <ShieldCheck size={10} strokeWidth={3} />
                            {user?.role === 'driver' ? (t('driver:role_driver') || 'DRIVER') : user?.role?.toUpperCase()}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Company Card */}
            {user?.company && (
                <Card className="p-4 flex flex-row items-center justify-between gap-0 bg-card/60 backdrop-blur-xl shadow-sm rounded-2xl">
                    <div className="flex flex-row items-center gap-3">
                        <Avatar className="size-11 border bg-background flex items-center justify-center rounded-full p-1 shrink-0">
                            {user.company.logo_full_url ? (
                                <AvatarImage src={user.company.logo_full_url} alt={user.company.name} className="object-contain" />
                            ) : null}
                            <AvatarFallback className="bg-muted text-muted-foreground rounded-full">
                                <Building2 size={18} />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none mb-1">
                                {t('driver:company')}
                            </span>
                            <span className="text-sm font-bold tracking-tight text-foreground">
                                {user.company.name}
                            </span>
                        </div>
                    </div>
                    
                    <div className="text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20 shrink-0">
                        {user.company.status}
                    </div>
                </Card>
            )}

            {/* Active Vehicle Shift Control */}
            <Card className="p-5 flex flex-col gap-4 bg-card/60 backdrop-blur-xl shadow rounded-2xl">
                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                        <Truck size={18} className="text-primary" />
                        <span className="text-sm font-black tracking-tight">{t('driver:active_vehicle') || 'Active Vehicle'}</span>
                    </div>
                    <div className={cn(
                        "h-2 w-2 rounded-full",
                        activeVehicle ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
                    )} />
                </div>

                {isActiveShiftLoading ? (
                    <div className="h-12 w-full animate-pulse bg-muted rounded-xl" />
                ) : activeVehicle ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3.5 bg-muted/40 p-3 rounded-xl">
                            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Truck size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black tracking-tight leading-none truncate mb-1">
                                    {activeVehicle.plate_number}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                                    {activeVehicle.type}
                                </span>
                            </div>
                        </div>

                        <Button 
                            variant="destructive"
                            size="sm"
                            className="w-full font-black uppercase tracking-wider rounded-xl py-4 flex items-center justify-center gap-1.5 h-10"
                            onClick={handleCheckOut}
                            disabled={checkOutMutation.isPending}
                        >
                            <LogOut size={14} strokeWidth={2.5} />
                            {checkOutMutation.isPending ? t('driver:checking_out') || 'Checking Out...' : t('driver:checkout_shift') || 'Check-out Shift'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 bg-muted/20 rounded-xl">
                        <Truck size={24} className="text-muted-foreground/60 mb-2" />
                        <span className="text-xs font-bold text-muted-foreground">
                            {t('driver:no_active_vehicle') || 'No active vehicle checked in'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80 mt-1 max-w-[200px]">
                            {t('driver:go_to_dashboard_checkin') || 'Go to dashboard to check-in to a vehicle to start tracking.'}
                        </span>
                    </div>
                )}
            </Card>

            {/* Task History Card */}
            <Card 
                className="p-4 flex flex-row items-center justify-between gap-0 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all rounded-2xl cursor-pointer hover:bg-muted/40" 
                onClick={() => navigate({ to: '/driver/task-history' })}
            >
                <div className="flex flex-row items-center gap-3">
                    <div className="size-11 border bg-background flex items-center justify-center rounded-xl shrink-0 text-primary shadow-inner">
                        <Calendar size={20} />
                    </div>
                    <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none mb-1">
                            {t('driver:analytics_records')}
                        </span>
                        <span className="text-sm font-black tracking-tight text-foreground">
                            {t('driver:task_history')}
                        </span>
                    </div>
                </div>
                
                <ChevronRight size={16} className="text-muted-foreground mr-1 shrink-0" />
            </Card>

            {/* PWA Settings & App Info */}
            <Card className="p-5 flex flex-col gap-4 bg-card/60 backdrop-blur-xl shadow rounded-2xl">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Globe size={18} className="text-primary" />
                    <span className="text-sm font-black tracking-tight">{t('driver:preferences') || 'Preferences'}</span>
                </div>

                {/* Language Switcher */}
                <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        {t('driver:app_language') || 'App Language'}
                    </span>
                    <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1 rounded-xl">
                        {[
                            { code: 'en', label: 'English' },
                            { code: 'kh', label: 'ខ្មែរ' },
                            { code: 'zh', label: '中文' }
                        ].map((lang) => {
                            const isActive = i18n.language.startsWith(lang.code);
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={cn(
                                        "py-2 rounded-lg text-xs font-black transition-all",
                                        isActive 
                                            ? "bg-background text-primary shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {lang.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Device Coordinates & Tracking status */}
                <div className="flex items-center justify-between mt-2 pt-3 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Navigation size={14} />
                        <span className="text-[11px] font-bold">
                            {t('driver:tracking_telemetry') || 'Tracking Telemetry'}
                        </span>
                    </div>
                    <span className="text-[9px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-black">
                        {activeVehicle ? 'ACTIVE' : 'IDLE'}
                    </span>
                </div>
            </Card>

            {/* Logout Trigger Card */}
            <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 font-black uppercase tracking-wider rounded-2xl h-12 border border-destructive/10 bg-destructive/[0.02] flex items-center justify-center gap-2"
                onClick={handleSignOut}
            >
                <LogOut size={16} strokeWidth={2.5} />
                {t('driver:sign_out') || 'Sign Out'}
            </Button>

            {/* Sign Out Confirmation Bottom Sheet */}
            <BottomSheet isOpen={isSignOutOpen} onClose={() => setIsSignOutOpen(false)}>
                <div className="flex flex-col gap-4 mt-4 text-center">
                    <div className="mx-auto size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <LogOut size={22} strokeWidth={2.5} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <h3 className="text-base font-black tracking-tight text-foreground">
                            {t('driver:confirm_sign_out_title') || 'Are you sure you want to sign out?'}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed px-4">
                            {t('driver:confirm_sign_out_description') || 'This will end your shift tracking and stop automatic GPS telemetry updates.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <Button 
                            variant="destructive" 
                            className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-11"
                            onClick={handleConfirmSignOut}
                        >
                            {t('driver:confirm_sign_out') || 'Sign Out'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-11 text-muted-foreground"
                            onClick={() => setIsSignOutOpen(false)}
                        >
                            {t('driver:cancel') || 'Cancel'}
                        </Button>
                    </div>
                </div>
            </BottomSheet>

        </div>
        </PullToRefresh>
    );
};

export default DriverProfile;
