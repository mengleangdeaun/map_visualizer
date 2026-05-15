import { useQuery } from '@tanstack/react-query';
import { locationService } from '../../fleet/services/locationService';

export const useHubs = (params: any = {}) => {
    return useQuery({
        queryKey: ['fleet', 'hubs', params],
        queryFn: () => locationService.getLocations({ ...params, type: 'local_node' }),
    });
};
