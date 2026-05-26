import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Lock, ArrowRight, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import map from '@/assets/images/map.svg'; // same background as login

const LockScreenPage = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    const { user, unlock, clearAuth } = useAuthStore();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const success = await unlock(password);
        if (success) {
            toast.success(t('welcome_back'));
            
            const currentUser = useAuthStore.getState().user;
            const isCurrentlyDriverApp = window.location.pathname.startsWith('/driver');

            if ((currentUser?.role === 'system_staff' || currentUser?.role === 'super_admin') && !currentUser?.company_id) {
                if (isCurrentlyDriverApp) {
                    window.location.href = '/system';
                } else {
                    navigate({ to: '/system' });
                }
            } else if (currentUser?.role === 'driver') {
                if (isCurrentlyDriverApp) {
                    navigate({ to: '/driver' });
                } else {
                    window.location.href = '/driver';
                }
            } else {
                if (isCurrentlyDriverApp) {
                    window.location.href = '/admin';
                } else {
                    navigate({ to: '/admin' });
                }
            }
        } else {
            toast.error(t('invalid_credentials'));
        }
        setIsLoading(false);
    };

    const handleLogout = () => {
        clearAuth();
        const isCurrentlyDriverApp = window.location.pathname.startsWith('/driver');
        const loginPath = isCurrentlyDriverApp ? '/driver/login' : '/auth/login';
        
        if (isCurrentlyDriverApp) {
            navigate({ to: loginPath });
        } else {
            window.location.href = loginPath;
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Full background image (same as login) */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${map})` }}
            />
            <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

            <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-5xl">
                    <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden ring-8 ring-offset-4 ring-white/20 bg-white">
                        {/* Left Column: Lock screen form */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8">
                            {/* Brand (same style as login) */}
                            <div className="flex flex-col items-start mb-6 pb-3 border-b-2 border-primary">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-black tracking-tighter uppercase text-primary">
                                        SCCG
                                    </h1>
                                </div>
                                <p className="text-muted-foreground text-xs font-medium mt-1 tracking-wide">
                                    Logistics & Fleet Management
                                </p>
                            </div>

                            <div>
                                {/* User info */}
                                <div className="flex flex-col items-center mb-6">
                                    <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl mb-4">
                                        <AvatarImage src={user?.profile_full_url || ''} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                            <UserIcon size={32} />
                                        </AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
                                    <p className="text-muted-foreground text-xs font-medium mt-1">
                                        {t('your_session_is_locked')}
                                    </p>
                                </div>

                                <form onSubmit={handleUnlock} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
                                            {t('password')}
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="password"
                                                type="password" 
                                                placeholder={t('password_placeholder')}
                                                className="pl-10 h-11"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                autoFocus
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-11 text-sm font-medium uppercase tracking-widest shadow-lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                        )}
                                        {t('unlock')}
                                    </Button>
                                </form>

                                {/* Logout link */}
                                <div className="mt-6 pt-4 border-t border-border">
                                    <button 
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest w-full"
                                    >
                                        <LogOut size={14} />
                                        {t('logout')}
                                    </button>
                                </div>

                                <p className="mt-8 text-center text-muted-foreground/60 text-[10px] font-semibold uppercase tracking-wide">
                                    &copy; 2026 SCCG &bull; All rights reserved.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Image (hidden on mobile) — you can replace this URL */}
                        <div className="hidden md:block md:w-1/2 bg-gray-100">
                            <img
                                src="https://plus.unsplash.com/premium_vector-1722102891181-cc8a9751e727?q=80&w=880&auto=format&fit=crop"
                                alt="Lock screen visual"
                                className="h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Label component (shadcn/ui)
const Label = ({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
        {children}
    </label>
);

export default LockScreenPage;