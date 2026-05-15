import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';

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
            
            // Redirect based on role or just to dashboard
            if ((data.user.role === 'system_staff' || data.user.role === 'super_admin') && !data.user.company_id) {
                navigate({ to: '/system' });
            } else if (data.user.role === 'driver') {
                navigate({ to: '/driver' });
            } else {
                navigate({ to: '/admin' });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('invalid_credentials'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            
            <div className="relative z-10 w-full max-w-md px-4">
                <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        MAP<span className="text-primary">CN</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        Logistics & Fleet Visualizer
                    </p>
                </div>

                <Card className="border-white/5 bg-white/5 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-white text-center">
                            {t('sign_in')}
                        </CardTitle>
                        <CardDescription className="text-center text-white/50">
                            {t('please_enter_your_details')}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    {t('email')}
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-2 size-4 text-white/30 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder={t('email_placeholder')} 
                                        className="bg-white/5 border-white/10 text-white pl-10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-white/70 text-xs font-semibold uppercase tracking-wider">
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
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-2 size-4 text-white/30 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        placeholder={t('password_placeholder')}
                                        className="bg-white/5 border-white/10 text-white pl-10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 h-4 w-4 transition-all"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                                <label htmlFor="remember" className="text-xs font-medium text-white/50 cursor-pointer select-none">
                                    {t('remember_me')}
                                </label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 mt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-11 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                )}
                                {t('sign_in')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                
                <p className="mt-8 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
                    &copy; 2026 MAPCN Systems &bull; Built with Pride
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
