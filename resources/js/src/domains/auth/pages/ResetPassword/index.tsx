import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '../../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import map from '@/assets/images/map.svg';

const ResetPasswordPage = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // Parse search query parameters from window.location
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email') || '';
        const tokenParam = params.get('token') || '';
        setEmail(emailParam);
        setToken(tokenParam);
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error(t('password_too_short', 'Password must be at least 8 characters long.'));
            return;
        }

        if (password !== passwordConfirmation) {
            toast.error(t('passwords_do_not_match', 'Passwords do not match.'));
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword({
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            setIsSuccess(true);
            toast.success(t('password_reset_success', 'Password reset successfully!'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('password_reset_failed', 'Failed to reset password. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
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
            {/* Background map image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${map})` }}
            />
            <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

            <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-5xl">
                    <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden ring-8 ring-offset-4 ring-white/20 bg-white">
                        {/* Left Column: Form */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between min-h-[500px]">
                            {/* Brand Header */}
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
                                {!isSuccess ? (
                                    <>
                                        <div className="space-y-2 mb-6">
                                            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4">
                                                <Lock className="size-6 text-primary" />
                                            </div>
                                            <h2 className="text-2xl font-bold">
                                                {t('reset_password_title', 'Create New Password')}
                                            </h2>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {t('reset_password_instructions', 'Please choose a secure and strong new password for your account.')}
                                            </p>
                                        </div>

                                        <form onSubmit={handleResetPassword} className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                                                    {t('email', 'Email Address')}
                                                </Label>
                                                <Input 
                                                    id="email" 
                                                    type="email" 
                                                    className="h-11 bg-slate-50 border border-slate-100 cursor-not-allowed"
                                                    value={email}
                                                    disabled
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
                                                    {t('new_password', 'New Password')}
                                                </Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        id="password" 
                                                        type="password" 
                                                        placeholder={t('new_password_placeholder', 'Enter new password')} 
                                                        className="pl-10 h-11"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="passwordConfirmation" className="text-xs font-semibold uppercase tracking-wider">
                                                    {t('confirm_password', 'Confirm New Password')}
                                                </Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        id="passwordConfirmation" 
                                                        type="password" 
                                                        placeholder={t('confirm_password_placeholder', 'Re-enter new password')} 
                                                        className="pl-10 h-11"
                                                        value={passwordConfirmation}
                                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
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
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                )}
                                                {t('reset_password_button', 'Reset Password')}
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="space-y-6 py-4">
                                        <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                                            <CheckCircle2 className="size-6 text-green-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold">
                                                {t('password_reset_completed', 'Password Updated!')}
                                            </h2>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {t('password_reset_success_explanation', 'Your password has been successfully updated. You can now use your new password to log in to your account.')}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleBackToLogin}
                                            className="w-full h-11 text-sm font-medium uppercase tracking-widest shadow-lg"
                                        >
                                            {t('go_to_login', 'Go to Login')}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Back to Login Button */}
                            <div className="mt-8 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={handleBackToLogin}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    <ArrowLeft size={14} />
                                    {t('back_to_login', 'Back to Login')}
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Image */}
                        <div className="hidden md:block md:w-1/2 bg-gray-100">
                            <img
                                src="https://plus.unsplash.com/premium_vector-1722102891181-cc8a9751e727?q=80&w=880&auto=format&fit=crop"
                                alt="Reset password illustration"
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

export default ResetPasswordPage;
