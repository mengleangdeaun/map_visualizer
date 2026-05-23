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

    return (
        <Card
            className={cn(
                "p-4 flex flex-col gap-3 relative transition-all shadow-sm",
                isUnread ? "bg-primary/5 shadow-primary/5" : "bg-card"
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
                    <span
                        className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                            data.priority === 'urgent' && "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse",
                            data.priority === 'high' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                            data.priority === 'normal' && "bg-slate-500/10 text-slate-600 border border-slate-500/20",
                            data.priority === 'low' && "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        )}
                    >
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
                <h3
                    className={cn(
                        "font-black text-sm tracking-tight leading-tight",
                        isUnread ? "text-primary" : "text-foreground"
                    )}
                >
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
                        onClick={() => onMarkRead(notification.id)}
                        disabled={isMarkingReadPending}
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
                    onClick={onViewTask}
                >
                    <ExternalLink size={12} />
                    {t('view_task') || 'View Task'}
                </Button>

                {/* Individual Trash Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all shrink-0 ml-auto"
                    onClick={() => onDelete(notification.id)}
                    disabled={isDeletingPending}
                    title={t('delete') || 'Delete'}
                >
                    <Trash2 size={13} />
                </Button>
            </div>
        </Card>
    );
};

export default NotificationCard;
