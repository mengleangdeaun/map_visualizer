import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Lock, ArrowRight, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

const LockScreenPage = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    const { user, unlock, clearAuth } = useAuthStore();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulating password check or calling me()
        const success = await unlock(password);
        if (success) {
            toast.success(t('welcome_back'));
            navigate({ to: '/' });
        } else {
            toast.error(t('invalid_credentials'));
        }
        setIsLoading(false);
    };

    const handleLogout = () => {
        clearAuth();
        navigate({ to: '/auth/login' });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
            
            <div className="relative z-10 w-full max-w-sm px-4 text-center">
                <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Avatar className="h-24 w-24 border-4 border-white/5 shadow-2xl mb-4">
                        <AvatarImage src={user?.profile_full_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                            <UserIcon size={32} />
                        </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-black text-white tracking-tight">{user?.name}</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                        {t('your_session_is_locked')}
                    </p>
                </div>

                <Card className="border-white/5 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleUnlock}>
                        <div className="p-6 space-y-4">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 size-4 text-white/30 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    type="password" 
                                    placeholder={t('password_placeholder')}
                                    className="bg-white/5 border-white/10 text-white pl-10 h-11 focus:border-primary/50 focus:ring-primary/20"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full h-11 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                                <span className="ml-2">{t('unlock')}</span>
                            </Button>
                        </div>
                    </form>
                    <div className="border-t border-white/5 p-4 bg-black/20">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 text-white/30 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest w-full"
                        >
                            <LogOut size={14} />
                            {t('logout')}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Simple Card component for Auth
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`rounded-2xl border ${className}`}>
        {children}
    </div>
);

export default LockScreenPage;
