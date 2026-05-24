import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useHeaderStore } from '../../store/useHeaderStore';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { Check, Trash2 } from 'lucide-react';
import { PullToRefresh } from '@/domains/driver/components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Iconsvg } from '@/components/shared/svg/IconState';

// Import local modular types, hooks, and sub-components
import { useDriverNotificationState } from './hooks/useDriverNotificationState';
import { NotificationCard } from './components/NotificationCard';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { DbNotification } from './types';

const DriverNotifications = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const setHeader = useHeaderStore(s => s.setHeader);

    // Coordinate page queries and mutation states
    const state = useDriverNotificationState();

    const {
        notifications,
        isLoading,
        unreadCount,
        refetch,
        isConfirmDeleteOpen,
        setIsConfirmDeleteOpen,
        markAsReadMutation,
        markAllAsReadMutation,
        deleteMutation,
        deleteAllMutation,
        handleMarkAllRead,
        handleDeleteAllConfirm,
    } = state;

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
                        // Skeleton Loader
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
                        <div className="flex flex-col items-center justify-center pt-8">
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
                        (notifications as DbNotification[]).map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkRead={(id) => markAsReadMutation.mutate(id)}
                                onDelete={(id) => deleteMutation.mutate(id)}
                                onViewTask={() => {
                                    const data = notification.data as any;
                                    const action = data.action || '';
                                    const metadata = data.metadata || {};
                                    
                                    const lat = data.lat || metadata.lat;
                                    const lng = data.lng || metadata.lng;
                                    const id = data.task_id || data.delivery_id || metadata.delivery_id || metadata.task_id || notification.id;

                                    if (lat && lng) {
                                        let focusType = 'task';
                                        if (action.includes('delivery')) {
                                            focusType = 'delivery';
                                        } else if (action.includes('roadblock')) {
                                            focusType = 'roadblock';
                                        }

                                        navigate({
                                            to: '/driver/map',
                                            search: {
                                                lat: String(lat),
                                                lng: String(lng),
                                                type: focusType,
                                                id: String(id),
                                            },
                                        });
                                    } else if (action.includes('delivery') || action.includes('route')) {
                                        navigate({ to: '/driver/route' });
                                    } else {
                                        navigate({ to: '/driver/tasks' });
                                    }
                                }}
                                isMarkingReadPending={markAsReadMutation.isPending}
                                isDeletingPending={deleteMutation.isPending}
                            />
                        ))
                    )}
                </div>

                {/* Bulk Deletion Safety Confirmation Sheet */}
                <ConfirmDeleteModal
                    isOpen={isConfirmDeleteOpen}
                    onClose={() => setIsConfirmDeleteOpen(false)}
                    onConfirm={handleDeleteAllConfirm}
                    isDeleting={deleteAllMutation.isPending}
                />

            </div>
        </PullToRefresh>
    );
};

export default DriverNotifications;
