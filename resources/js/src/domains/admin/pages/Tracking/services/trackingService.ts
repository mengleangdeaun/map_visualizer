import { deliveryService } from '../../../services/deliveryService';
import { taskService } from '../../Tasks/services/taskService';
import { TrackingResult } from '../types';

export const trackingService = {
    track: async (trackingNumber: string, type: 'all' | 'delivery' | 'task'): Promise<TrackingResult | null> => {
        const query = trackingNumber.trim();
        if (!query) return null;

        // Track Delivery
        if (type === 'all' || type === 'delivery') {
            try {
                const res = await deliveryService.getDeliveries({ search: query });
                if (res && res.data && res.data.length > 0) {
                    const match = res.data.find(
                        (d) => d.tracking_number.trim().toUpperCase() === query.toUpperCase()
                    );
                    if (match) {
                        return { type: 'delivery', data: match };
                    }
                }
            } catch (err) {
                console.error('Error tracking delivery:', err);
            }
        }

        // Track Fleet Task
        if (type === 'all' || type === 'task') {
            try {
                const res = await taskService.list({ search: query });
                if (res && res.data && res.data.length > 0) {
                    const match = res.data.find(
                        (t) => t.tracking_number.trim().toUpperCase() === query.toUpperCase()
                    );
                    if (match) {
                        return { type: 'task', data: match };
                    }
                }
            } catch (err) {
                console.error('Error tracking task:', err);
            }
        }

        return null;
    },
};
