export interface Driver {
    id: string;
    name: string;
    vehicleType: 'car' | 'bike' | 'tuk_tuk';
    rating: number;
    distance: number;
    coordinates: [number, number];
    status: 'online' | 'busy' | 'offline';
    lastSeen?: string;
    velocity?: [number, number];
}
