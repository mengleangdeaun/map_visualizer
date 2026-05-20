import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentNumberingService, DocumentNumberSetting } from '../services/documentNumberingService';
import { toast } from 'sonner';

export const useDocumentNumberSettings = (params: any = {}) => {
    return useQuery({
        queryKey: ['admin', 'document-number-settings', params],
        queryFn: () => documentNumberingService.list(params),
    });
};

export const useCreateDocumentNumberSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<DocumentNumberSetting>) => documentNumberingService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'document-number-settings'] });
            toast.success('Document numbering setting created successfully');
        },
    });
};

export const useUpdateDocumentNumberSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DocumentNumberSetting> }) => 
            documentNumberingService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'document-number-settings'] });
            toast.success('Document numbering setting updated successfully');
        },
    });
};

export const useDeleteDocumentNumberSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentNumberingService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'document-number-settings'] });
            toast.success('Document numbering setting deleted successfully');
        },
    });
};

export const useGenerateTestNumber = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentNumberingService.generate(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'document-number-settings'] });
            toast.success(`Generated test number: ${data.number}`);
        },
        onError: () => {
            toast.error('Failed to generate test number');
        }
    });
};
