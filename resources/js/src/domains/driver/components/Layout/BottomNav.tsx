import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, ListChecks, Map as MapIcon, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverNotifications } from '../../hooks/useDriverNotifications';

export const BottomNav = () => {
    const location = useLocation();
    const { data: notificationsData } = useDriverNotifications();

    const unreadCount = React.useMemo(() => {
        if (!notificationsData?.data) return 0;
        return notificationsData.data.filter((n: any) => !n.read_at).length;
    }, [notificationsData?.data]);

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/driver' },
        { id: 'tasks', label: 'Tasks', icon: ListChecks, path: '/driver/tasks' },
        { id: 'map', label: 'Live Map', icon: MapIcon, path: '/driver/map' },
        { id: 'notifications', label: 'Alerts', icon: Bell, path: '/driver/notifications', badge: unreadCount },
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
                            "flex flex-col items-center gap-0.5 group transition-all duration-300 relative shrink-0 w-16",
                            isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className="p-2 relative transition-all duration-300">
                            <Icon 
                                size={20} 
                                strokeWidth={isActive ? 2.5 : 2} 
                                fill={isActive ? "currentColor" : "none"} 
                                className="transition-all duration-300"
                            />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-destructive rounded-full text-[8px] font-black text-white flex items-center justify-center border border-background animate-pulse shadow-md">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        <span className="text-[8px] font-medium uppercase tracking-wide text-center mt-0.5 leading-none">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};
