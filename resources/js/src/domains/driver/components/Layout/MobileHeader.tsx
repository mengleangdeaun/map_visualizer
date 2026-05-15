import React from 'react';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    isOnline?: boolean;
}

export const MobileHeader = ({ isOnline = false }: MobileHeaderProps) => {
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b px-4 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-inner">
                    {user?.name?.substring(0, 2).toUpperCase() || 'DR'}
                </div>
                <div className="flex flex-col">
                    <span className="text-[13px] font-black tracking-tight leading-none mb-1 truncate max-w-[120px]">
                        {user?.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
                        )} />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
                </button>
                <button className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
};
