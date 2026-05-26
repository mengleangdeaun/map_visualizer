import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '../../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import map from '@/assets/images/map.svg';

const ForgotPasswordPage = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleResetLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setIsSent(true);
            toast.success(t('reset_link_sent_success', 'Password reset link sent successfully! Check your email.'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('forgot_password_failed', 'Failed to send reset link. Please try again.'));
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
                                {!isSent ? (
                                    <>
                                        <div className="space-y-2 mb-6">
                                            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4">
                                                <KeyRound className="size-6 text-primary" />
                                            </div>
                                            <h2 className="text-2xl font-bold">
                                                {t('forgot_password_title', 'Forgot Password?')}
                                            </h2>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {t('forgot_password_instructions', "No worries! Enter your account email, and we'll send you a password reset link.")}
                                            </p>
                                        </div>

                                        <form onSubmit={handleResetLink} className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                                                    {t('email', 'Email Address')}
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        id="email" 
                                                        type="email" 
                                                        placeholder={t('email_placeholder', 'Enter your email')} 
                                                        className="pl-10 h-11"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
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
                                                    <Mail className="mr-2 h-4 w-4" />
                                                )}
                                                {t('send_reset_link', 'Send Reset Link')}
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="space-y-6 py-4">
                                        <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                                            <ShieldAlert className="size-6 text-green-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold">
                                                {t('check_your_email', 'Check Your Email')}
                                            </h2>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {t('email_sent_explanation', 'We have sent a secure password reset link to:')}
                                            </p>
                                            <p className="font-semibold text-foreground bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm font-mono mt-2">
                                                {email}
                                            </p>
                                        </div>
                                        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 text-xs text-amber-800 leading-relaxed">
                                            {t('spam_notice', "If you don't receive the email within 5 minutes, please check your spam or junk folder.")}
                                        </div>
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
                                alt="Forgot password illustration"
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

export default ForgotPasswordPage;
