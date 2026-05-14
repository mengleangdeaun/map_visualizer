import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../../domains/auth/store/useAuthStore';
import { Loader2, Map as MapIcon } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const AuthGuard = ({ children, requireAdmin = false }: AuthGuardProps) => {
    const navigate = useNavigate();
    const { isAuthenticated, isLocked, user } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate({ to: '/auth/login' });
        } else if (isLocked) {
            navigate({ to: '/auth/lockscreen' });
        }
    }, [isAuthenticated, isLocked, navigate]);

    if (!isAuthenticated) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4 animate-pulse">
                        <MapIcon className="size-6 text-primary" />
                    </div>
                    <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                </div>
            </div>
        );
    }

    if (isLocked) {
        return null; // Will be redirected by useEffect
    }

    return <>{children}</>;
};
