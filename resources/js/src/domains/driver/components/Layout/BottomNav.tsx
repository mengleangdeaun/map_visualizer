import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, ListChecks, Map as MapIcon, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/driver' },
        { id: 'tasks', label: 'Tasks', icon: ListChecks, path: '/driver/tasks' },
        { id: 'map', label: 'Live Map', icon: MapIcon, path: '/driver/map' },
        { id: 'profile', label: 'Profile', icon: User, path: '/driver/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t h-[72px] px-6 flex items-center justify-between pb-safe">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={cn(
                            "flex flex-col items-center gap-1 group transition-all duration-300",
                            isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-all duration-300",
                            isActive ? "bg-primary/10" : "group-hover:bg-muted"
                        )}>
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};
