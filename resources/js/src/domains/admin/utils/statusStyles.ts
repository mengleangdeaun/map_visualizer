export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'archived' | 'rescheduled';
export type DeliveryStatus = 'pending' | 'at_hub' | 'linehaul' | 'out_for_delivery' | 'delivered' | 'failed' | 'rescheduled';

export const getTaskStatusStyle = (status: TaskStatus): string => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
        case 'assigned':
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        case 'in_progress':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
        case 'completed':
            return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
        case 'cancelled':
            return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
        case 'archived':
            return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
        case 'rescheduled':
            return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
        default:
            return 'bg-muted text-muted-foreground border-muted';
    }
};

export const getDeliveryStatusStyle = (status: DeliveryStatus): string => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
        case 'at_hub':
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        case 'linehaul':
            return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
        case 'out_for_delivery':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
        case 'delivered':
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        case 'failed':
            return 'bg-destructive/10 text-destructive border-destructive/20';
        case 'rescheduled':
            return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        default:
            return 'bg-muted text-muted-foreground border-muted';
    }
};
