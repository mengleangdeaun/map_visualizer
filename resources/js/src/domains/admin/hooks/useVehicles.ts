import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService, Vehicle } from '../services/vehicleService';
import { toast } from 'sonner';

export const useVehicles = (params: any = {}) => {
    return useQuery({
        queryKey: ['admin', 'vehicles', params],
        queryFn: () => vehicleService.list(params),
    });
};

export const useCreateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Vehicle>) => vehicleService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
            toast.success('Vehicle created successfully');
        },
    });
};

export const useUpdateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => 
            vehicleService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
            toast.success('Vehicle updated successfully');
        },
    });
};

export const useDeleteVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => vehicleService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
            toast.success('Vehicle deleted successfully');
        },
    });
};
