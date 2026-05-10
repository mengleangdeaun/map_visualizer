import { MenuItem } from '@/types/nav';
import { Home } from 'lucide-react';

export const adminNav: MenuItem[] = [
    {
        id: 'dashboard',
        title: 'dashboard',
        icon: Home,
        children: [
            { id: 'sales', title: 'sales', path: '/' },
        ]
    }
];
