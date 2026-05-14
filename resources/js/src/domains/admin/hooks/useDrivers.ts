import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { User, PaginatedResponse } from '../../system/services/userService';
import { useAuthStore } from '../../auth/store/useAuthStore';

export const useDrivers = () => {
    const { user } = useAuthStore();
    
    return useQuery({
        queryKey: ['admin', 'drivers', user?.company_id],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<User>>('/system/users', {
                params: {
                    role: 'driver',
                    company_id: user?.company_id,
                    per_page: 100 // Get all drivers for the dropdown
                }
            });
            return data.data;
        },
        enabled: !!user,
    });
};
