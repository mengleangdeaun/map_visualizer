import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DbNotification } from '../types';

interface NotificationCardProps {
    notification: DbNotification;
    onMarkRead: (id: string) => void;
    onDelete: (id: string) => void;
    onViewTask: () => void;
    isMarkingReadPending: boolean;
    isDeletingPending: boolean;
}

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

export const NotificationCard: React.FC<NotificationCardProps> = ({
    notification,
    onMarkRead,
    onDelete,
    onViewTask,
    isMarkingReadPending,
    isDeletingPending,
}) => {
    const { t } = useTranslation();
    const isUnread = !notification.read_at;
    const data = notification.data;
    const isRouteAction = data.action?.includes('delivery') || data.action?.includes('route');
    const isRoadblock = data.action?.includes('roadblock');

    return (
        <Card
            className={cn(
                "relative p-4 pl-7 flex flex-col gap-2 transition-colors duration-200 border-none ring-0 shadow-none rounded-xl",
                isUnread 
                    ? "bg-primary/[0.04] dark:bg-primary/[0.02]" 
                    : "bg-transparent hover:bg-muted/30"
            )}
        >
            {/* Minimalist Absolute Unread dot */}
            {isUnread && (
                <span className="absolute top-[22px] left-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            )}

            {/* Header: Priority & Time */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    {data.priority && (
                        <span
                            className={cn(
                                "text-[9px] font-bold tracking-wider uppercase",
                                data.priority === 'urgent' && "text-destructive",
                                data.priority === 'high' && "text-amber-500",
                                data.priority === 'normal' && "text-muted-foreground/80",
                                data.priority === 'low' && "text-blue-500"
                            )}
                        >
                            {t(`priority_${data.priority}`) || data.priority}
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1">
                    <Clock size={10} className="opacity-60" />
                    {formatRelativeTime(notification.created_at)}
                </span>
            </div>

            {/* Content Body */}
            <div className="space-y-0.5 text-left">
                <h3
                    className={cn(
                        "text-sm font-semibold tracking-tight leading-tight",
                        isUnread ? "text-primary" : "text-foreground/90"
                    )}
                >
                    {data.title}
                </h3>
                {data.description && (
                    <p className="text-[11.5px] text-muted-foreground/80 font-normal leading-normal">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-3 mt-1">
                {isUnread && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-semibold text-muted-foreground/80 hover:text-foreground flex items-center gap-1 px-2 rounded hover:bg-muted/40 transition-colors"
                        onClick={() => onMarkRead(notification.id)}
                        disabled={isMarkingReadPending}
                    >
                        <Eye size={11} />
                        {t('mark_read') || 'Mark Read'}
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 text-[10px] font-semibold flex items-center gap-1 px-2 rounded transition-colors",
                        isUnread
                            ? "text-primary hover:text-primary/80 hover:bg-primary/[0.04]"
                            : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40"
                    )}
                    onClick={onViewTask}
                >
                    <ExternalLink size={11} />
                    {isRouteAction 
                        ? (t('view_route') || 'View Route') 
                        : isRoadblock 
                            ? (t('view') || 'View') 
                            : (t('view_task') || 'View Task')}
                </Button>

                {/* Individual Trash/Delete Action */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 rounded transition-all shrink-0 ml-auto"
                    onClick={() => onDelete(notification.id)}
                    disabled={isDeletingPending}
                    title={t('delete') || 'Delete'}
                >
                    <Trash2 size={12} />
                </Button>
            </div>
        </Card>
    );
};

export default NotificationCard;
