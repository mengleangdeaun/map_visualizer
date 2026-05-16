import { TaskStatus } from '../services/taskService';

export const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
        case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
        case 'assigned': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
        case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
        case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
        case 'archived': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        default: return 'bg-muted text-muted-foreground';
    }
};
