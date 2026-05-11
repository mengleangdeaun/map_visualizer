import { useQuery } from '@tanstack/react-query';
import { companyService } from '../../../services/companyService';

export const useCompanies = (page = 1) => {
    return useQuery({
        queryKey: ['companies', page],
        queryFn: () => companyService.getCompanies(page),
    });
};
