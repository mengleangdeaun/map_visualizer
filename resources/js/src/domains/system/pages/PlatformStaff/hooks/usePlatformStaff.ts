import { useUsers } from '../../User/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';

export const usePlatformStaff = (debouncedSearch: string, page: number, perPage: number) => {
    return useUsers({
        page,
        per_page: perPage,
        search: debouncedSearch,
        type: 'platform'
    });
};
