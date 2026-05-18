import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from '@tanstack/react-router';
import { ChevronLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeaderStore } from '../../store/useHeaderStore';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    isOnline?: boolean;
}

export const MobileHeader = ({ isOnline = false }: MobileHeaderProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { config } = useHeaderStore();
    const { user } = useAuthStore();

    // Track SPA history pathnames within the session storage
    useEffect(() => {
        const path = location.pathname;
        try {
            const historyJson = sessionStorage.getItem('mapcn_driver_history') || '[]';
            const historyList = JSON.parse(historyJson);
            
            // Only push if it is not the last recorded path to avoid duplicates
            if (historyList[historyList.length - 1] !== path) {
                historyList.push(path);
                // Keep history list capped at 50 items
                if (historyList.length > 50) historyList.shift();
                sessionStorage.setItem('mapcn_driver_history', JSON.stringify(historyList));
            }
        } catch (e) {
            console.error(e);
        }
    }, [location.pathname]);

    // Default header configuration if nothing is set by the active page
    const hasConfig = !!(config.title || config.showBackButton || config.rightAction);

    if (!hasConfig) {
        const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';
        return (
            <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b px-4 h-16 flex items-center justify-between shadow-sm">
                {/* Left: Company Logo & Name */}
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9 border bg-background flex items-center justify-center rounded-full shrink-0 shadow-inner select-none p-0.5">
                        <AvatarImage 
                            src={user?.company?.logo_full_url || undefined} 
                            alt={user?.company?.name} 
                            className="object-contain" 
                        />
                        <AvatarFallback className="font-black bg-primary/10 text-primary text-xs rounded-full">
                            {user?.company?.name?.substring(0, 2).toUpperCase() || 'CP'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tight leading-none text-foreground">
                            {user?.company?.name || 'MapCN Fleet'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
                            )} />
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: User Profile Avatar */}
                <Link to="/driver/profile" className="focus:outline-none select-none">
                    <Avatar className="h-10 w-10 border shadow-sm cursor-pointer hover:opacity-85 transition-opacity">
                        <AvatarImage src={user?.profile_full_url || undefined} alt={user?.name} className="object-cover" />
                        <AvatarFallback className="font-black bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                </Link>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b px-4 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
                {config.showBackButton && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-9 rounded-xl hover:bg-muted shrink-0"
                        onClick={() => {
                            try {
                                const historyJson = sessionStorage.getItem('mapcn_driver_history') || '[]';
                                const historyList = JSON.parse(historyJson);
                                
                                if (historyList.length > 1) {
                                    // Remove the current active route from the stack
                                    historyList.pop();
                                    // Retrieve the actual previous visited route
                                    const prevPath = historyList.pop();
                                    
                                    // Update the sessionStorage history list
                                    sessionStorage.setItem('mapcn_driver_history', JSON.stringify(historyList));
                                    
                                    if (prevPath) {
                                        navigate({ to: prevPath });
                                        return;
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            }

                            // Fallback if no local history stack is populated
                            if (config.backTarget) {
                                navigate({ to: config.backTarget });
                            } else {
                                navigate({ to: -1 as any });
                            }
                        }}
                    >
                        <ChevronLeft size={20} />
                    </Button>
                )}
                {config.title && (
                    <h1 className="text-base font-semibold leading-relaxed truncate max-w-[200px]">
                        {config.title}
                    </h1>
                )}
            </div>

            {config.rightAction && (
                <div className="flex items-center shrink-0">
                    {config.rightAction}
                </div>
            )}
        </header>
    );
};
