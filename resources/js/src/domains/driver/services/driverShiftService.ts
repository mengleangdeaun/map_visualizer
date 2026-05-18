import api from '@/lib/api';

export interface Vehicle {
    id: string;
    company_id: string;
    driver_id: string | null;
    type: 'motorcycle' | 'tuktuk' | 'minivan' | 'box_truck';
    plate_number: string;
    is_active: boolean;
    latitude: number | null;
    longitude: number | null;
}

export interface VehicleShift {
    id: string;
    vehicle_id: string;
    driver_id: string;
    started_at: string;
    ended_at: string | null;
    status: 'active' | 'completed';
    vehicle?: Vehicle;
}

export interface ActiveVehicleResponse {
    shift: VehicleShift | null;
    vehicle: Vehicle | null;
}

export const driverShiftService = {
    /**
     * Get current active shift and vehicle.
     */
    getActiveVehicle: async (): Promise<ActiveVehicleResponse> => {
        const { data } = await api.get('/driver/vehicle/active');
        return data;
    },

    /**
     * Check in to a specific vehicle.
     */
    checkIn: async (vehicleId: string): Promise<{ message: string; shift: VehicleShift; vehicle: Vehicle }> => {
        const { data } = await api.post('/driver/vehicle/check-in', { vehicle_id: vehicleId });
        return data;
    },

    /**
     * Check out of the current vehicle shift.
     */
    checkOut: async (): Promise<{ message: string }> => {
        const { data } = await api.post('/driver/vehicle/check-out');
        return data;
    },

    /**
     * Get all vehicles belonging to the driver's company.
     */
    getCompanyVehicles: async (): Promise<Vehicle[]> => {
        const { data } = await api.get('/admin/fleet/vehicles', {
            params: {
                per_page: 100, // retrieve all vehicles
            }
        });
        // Handle both pagination wrapper and raw arrays if any
        return Array.isArray(data) ? data : (data.data || []);
    }
};
