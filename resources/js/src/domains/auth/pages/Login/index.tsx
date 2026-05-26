import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import map from '@/assets/images/map.svg';

const LoginPage = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await authService.login({ email, password, remember });
            setAuth(data.user, data.access_token);
            toast.success(t('welcome_back'));
            
            const isCurrentlyDriverApp = window.location.pathname.startsWith('/driver');
            
            if ((data.user.role === 'system_staff' || data.user.role === 'super_admin') && !data.user.company_id) {
                if (isCurrentlyDriverApp) {
                    window.location.href = '/system';
                } else {
                    navigate({ to: '/system' });
                }
            } else if (data.user.role === 'driver') {
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
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('invalid_credentials'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full  overflow-hidden">
            {/* Full background image */}
            <div 
                className="absolute inset-0  bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${map})` }}
            />
            <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

            <div className="relative z-10 flex min-h-screen items-center  justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-5xl">
                    <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden ring-8 ring-offset-4 ring-white/20 bg-white">
                        {/* Left Column: Login Form */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8">
                            <div className="flex flex-col items-start mb-6 text-center pb-3 border-b-2 border-primary">
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
                                <div className="space-y-1 mb-6">
                                    <h2 className="text-2xl font-semibold text-center">
                                        {t('sign_in')}
                                    </h2>
                                    <p className="text-center text-muted-foreground text-sm">
                                        {t('please_enter_your_details')}
                                    </p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                                            {t('email')}
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="email" 
                                                type="email" 
                                                placeholder={t('email_placeholder')} 
                                                className="pl-10 h-11"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
                                                {t('password')}
                                            </Label>
                                            <button 
                                                type="button"
                                                onClick={() => navigate({ to: '/auth/forgot-password' })}
                                                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight"
                                            >
                                                {t('forgot_password')}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="password" 
                                                type="password" 
                                                placeholder={t('password_placeholder')}
                                                className="pl-10 h-11"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-1">
                                        <Checkbox
                                            id="remember"
                                            className="h-4 w-4"
                                            checked={remember}
                                            onCheckedChange={(value) => setRemember(value as boolean)}
                                        />
                                        <label htmlFor="remember" className="text-xs font-medium cursor-pointer select-none">
                                            {t('remember_me')}
                                        </label>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-11 text-sm font-medium uppercase tracking-widest shadow-lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                        )}
                                        {t('sign_in')}
                                    </Button>
                                </form>

                                <p className="mt-8 text-center text-muted-foreground/60 text-[10px] font-semibold uppercase tracking-wide">
                                    &copy; 2026 SCCG &bull; All rights reserved.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Image (hidden on mobile) */}
                        <div className="hidden md:block md:w-1/2 bg-gray-100">
                            <img
                                src="https://plus.unsplash.com/premium_vector-1722102891181-cc8a9751e727?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?q=80&w=2070&auto=format&fit=crop"
                                alt="Fleet management"
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

export default LoginPage;