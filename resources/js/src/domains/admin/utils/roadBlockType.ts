export type RoadblockType = 'blockage' | 'accident' | 'flood' | 'traffic' | 'other';

export interface RoadblockTypeOption {
    value: RoadblockType;
    label: string;
    color: string;      // Tailwind text color & bg
    border: string;     // Tailwind border color
    badge: string;      // Tailwind styles for Badge
    pulse: string;      // Tailwind color for ping ring
}

export const roadblockTypeOptions: Record<RoadblockType, RoadblockTypeOption> = {
    blockage: {
        value: 'blockage',
        label: 'Road Blocked / Closed',
        color: 'text-red-500',
        border: 'border-red-500',
        badge: 'border-red-500/20 text-red-500 bg-red-500/5',
        pulse: 'bg-red-500'
    },
    accident: {
        value: 'accident',
        label: 'Traffic Accident',
        color: 'text-orange-500',
        border: 'border-orange-500',
        badge: 'border-orange-500/20 text-orange-500 bg-orange-500/5',
        pulse: 'bg-orange-500'
    },
    flood: {
        value: 'flood',
        label: 'Severe Flooding',
        color: 'text-blue-500',
        border: 'border-blue-500',
        badge: 'border-blue-500/20 text-blue-500 bg-blue-500/5',
        pulse: 'bg-blue-500'
    },
    traffic: {
        value: 'traffic',
        label: 'Severe Traffic Jam',
        color: 'text-amber-500',
        border: 'border-amber-500',
        badge: 'border-amber-500/20 text-amber-500 bg-amber-500/5',
        pulse: 'bg-amber-500'
    },
    other: {
        value: 'other',
        label: 'Other Hazard',
        color: 'text-purple-500',
        border: 'border-purple-500',
        badge: 'border-purple-500/20 text-purple-500 bg-purple-500/5',
        pulse: 'bg-purple-500'
    }
};

export const getRoadblockTypeStyles = (type: RoadblockType): RoadblockTypeOption => {
    return roadblockTypeOptions[type] || roadblockTypeOptions.blockage;
};
