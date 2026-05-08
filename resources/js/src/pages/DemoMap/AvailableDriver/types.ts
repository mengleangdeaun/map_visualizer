export interface Driver {
    id: string;
    name: string;
    vehicleType: 'car' | 'bike' | 'tuk_tuk';
    rating: number;
    distance: number;
    coordinates: [number, number];
    status: 'online' | 'busy';
    velocity?: [number, number]; // Optional as it's mainly for simulation
}
