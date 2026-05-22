import { Delivery } from '../../../services/deliveryService';
import { Task } from '../../Tasks/services/taskService';

export type TrackingType = 'delivery' | 'task';

export type TrackingItem = Delivery | Task;

export interface TrackingResult {
    type: TrackingType;
    data: TrackingItem;
}

export interface TrackingMapProps {
    type: TrackingType;
    item: TrackingItem;
}

export interface TrackingDetailsProps {
    type: TrackingType;
    item: TrackingItem;
}
