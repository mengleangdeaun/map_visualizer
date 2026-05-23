export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface NotificationData {
    task_id?: string;
    title: string;
    description?: string;
    priority?: NotificationPriority | string;
    status?: string;
    scheduled_at?: string;
    action?: string;
    metadata?: Record<string, any>;
}

export interface DbNotification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}
