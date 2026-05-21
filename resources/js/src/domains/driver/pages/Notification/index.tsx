import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useHeaderStore } from '../../store/useHeaderStore';
import { 
    Check, 
    Clock, 
    Eye, 
    ExternalLink, 
    BellOff,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { 
    useDriverNotifications, 
    useMarkNotificationAsRead, 
    useMarkAllNotificationsAsRead,
    useDeleteNotification,
    useDeleteAllNotifications
} from '../../hooks/useDriverNotifications';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { BottomSheet } from '@/domains/driver/components/BottomSheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Iconsvg } from '@/components/shared/svg/IconState';

const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const DriverNotifications = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // Deletion states
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // Queries & Mutations
    const { data: notificationsData, isLoading, refetch } = useDriverNotifications();
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();
    const deleteMutation = useDeleteNotification();
    const deleteAllMutation = useDeleteAllNotifications();

    const notifications = notificationsData?.data || [];
    
    const unreadCount = React.useMemo(() => {
        return notifications.filter(n => !n.read_at).length;
    }, [notifications]);

    const handleMarkAllRead = () => {
        if (unreadCount > 0) {
            markAllAsReadMutation.mutate();
        }
    };

    const handleDeleteAllConfirm = () => {
        deleteAllMutation.mutate(undefined, {
            onSuccess: () => {
                setIsConfirmDeleteOpen(false);
            }
        });
    };

    const setHeader = useHeaderStore(s => s.setHeader);

    useEffect(() => {
        setHeader({
            title: t('notifications') || 'Notifications',
            showBackButton: true,
            backTarget: '/driver',
            rightAction: notifications.length > 0 ? (
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-xl text-primary hover:bg-primary/5 shrink-0 transition-all"
                            onClick={handleMarkAllRead}
                            disabled={markAllAsReadMutation.isPending}
                            title={t('mark_all_read') || 'Mark all read'}
                        >
                            <Check size={18} strokeWidth={3} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-xl text-destructive hover:bg-destructive/5 shrink-0 transition-all"
                        onClick={() => setIsConfirmDeleteOpen(true)}
                        disabled={deleteAllMutation.isPending}
                        title={t('delete_all') || 'Delete all'}
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            ) : undefined
        });
        return () => setHeader({});
    }, [setHeader, unreadCount, notifications.length, t, markAllAsReadMutation.isPending, deleteAllMutation.isPending]);

    return (
        <PullToRefresh onRefresh={refetch}>
            <div className="p-4 flex flex-col gap-5 max-w-md mx-auto animate-in fade-in duration-500 pb-20">

                {/* Notification List Feed */}
                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        // Skeleton State
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="p-4 animate-pulse flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-muted rounded-full" />
                                    <div className="h-3 w-12 bg-muted rounded" />
                                </div>
                                <div className="h-5 w-2/3 bg-muted rounded" />
                                <div className="h-4 w-full bg-muted rounded" />
                            </Card>
                        ))
                    ) : notifications.length === 0 ? (
                        // Elegant Empty State
                        <div className='flex flex-col items-center justify-center'>
                            <div className="space-y-2">
                            <Iconsvg name="box" />
                                <h3 className="font-semibold text-sm text-center">{t('all_caught_up') || 'All Caught Up!'}</h3>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                    {t('no_notifications_desc') || "You don't have any notifications at the moment."}
                                </p>
                            </div>
                        </div>
                        
                    ) : (
                        // Notifications Listing
                        notifications.map((notification) => {
                            const isUnread = !notification.read_at;
                            const data = notification.data;
                            
                            return (
                                <Card 
                                    key={notification.id} 
                                    className={cn(
                                        "p-4 flex flex-col gap-3 relative transition-all shadow-sm",
                                        isUnread 
                                            ? "bg-primary/5 shadow-primary/5 " 
                                            : "bg-card"
                                    )}
                                >
                                    {/* Unread Pulse Indicator */}
                                    {isUnread && (
                                        <span className="absolute top-2 right-2 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                    )}

                                    {/* Card Header */}
                                    <div className="flex items-center justify-between">
                                        {data.priority && (
                                            <span className={cn(
                                                "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                data.priority === 'urgent' && "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse",
                                                data.priority === 'high' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                                                data.priority === 'normal' && "bg-slate-500/10 text-slate-600 border border-slate-500/20",
                                                data.priority === 'low' && "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                            )}>
                                                {t(`priority_${data.priority}`) || data.priority}
                                            </span>
                                        )}
                                        
                                        <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatRelativeTime(notification.created_at)}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-1 pr-6 text-left">
                                        <h3 className={cn(
                                            "font-black text-sm tracking-tight leading-tight",
                                            isUnread ? "text-primary" : "text-foreground"
                                        )}>
                                            {data.title}
                                        </h3>
                                        {data.description && (
                                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                                {data.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-1 border-t border-border/20 pt-3">
                                        {isUnread && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 bg-muted/30 hover:bg-muted/50 rounded-lg transition-all"
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                                disabled={markAsReadMutation.isPending}
                                            >
                                                <Eye size={12} />
                                                {t('mark_read') || 'Mark Read'}
                                            </Button>
                                        )}
                                        
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "h-8 text-[10px] font-medium uppercase tracking-wide flex items-center gap-1 px-2.5 rounded-lg transition-all",
                                                isUnread 
                                                    ? "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10" 
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            )}
                                            onClick={() => navigate({ to: '/driver/tasks' })}
                                        >
                                            <ExternalLink size={12} />
                                            {t('view_task') || 'View Task'}
                                        </Button>

                                        {/* Individual Trash Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all shrink-0 ml-auto"
                                            onClick={() => deleteMutation.mutate(notification.id)}
                                            disabled={deleteMutation.isPending}
                                            title={t('delete') || 'Delete'}
                                        >
                                            <Trash2 size={13} />
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Bulk Deletion Safety Confirmation Sheet */}
                <BottomSheet isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)}>
                    <div className="flex flex-col gap-4 mt-4 text-center">
                        <div className="mx-auto size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                            <AlertTriangle size={22} strokeWidth={2.5} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <h3 className="text-base font-black tracking-tight text-foreground">
                                {t('delete_all') || 'Delete all notifications?'}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed px-4">
                                {t('delete_all_warning') || 'Are you sure you want to delete all notifications? This action cannot be undone.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <Button 
                                variant="destructive" 
                                className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-11"
                                onClick={handleDeleteAllConfirm}
                                disabled={deleteAllMutation.isPending}
                            >
                                {deleteAllMutation.isPending ? t('deleting') || 'Deleting...' : t('delete') || 'Delete'}
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full font-black uppercase tracking-wider rounded-xl py-4 h-11 text-muted-foreground"
                                onClick={() => setIsConfirmDeleteOpen(false)}
                                disabled={deleteAllMutation.isPending}
                            >
                                {t('cancel') || 'Cancel'}
                            </Button>
                        </div>
                    </div>
                </BottomSheet>

            </div>
        </PullToRefresh>
    );
};

export default DriverNotifications;
