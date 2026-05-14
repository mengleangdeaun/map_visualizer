import { MenuItem } from '@/types/nav';
import { Home, Truck } from 'lucide-react';

export const adminNav: MenuItem[] = [
    {
        id: 'dashboard',
        title: 'dashboard',
        icon: Home,
        children: [
            { id: 'sales', title: 'sales', path: '/' },
        ]
    },
    {
        id: 'fleet',
        title: 'fleet',
        icon: Truck,
        children: [
            { id: 'vehicles', title: 'vehicles', path: '/admin/fleet/vehicles' },
            { id: 'hubs', title: 'hubs', path: '/admin/fleet/hubs' },
        ]
    }
];
