import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, Customer } from '../services/customerService';
import { toast } from 'sonner';

export const useCustomers = (params: any = {}) => {
    return useQuery({
        queryKey: ['admin', 'customers', params],
        queryFn: () => customerService.list(params),
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Customer>) => customerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
            toast.success('Customer created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create customer');
        }
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => 
            customerService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
            toast.success('Customer updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update customer');
        }
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => customerService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
            toast.success('Customer deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        }
    });
};
