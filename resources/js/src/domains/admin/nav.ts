import { MenuItem } from '@/types/nav';
import { Home, Truck, Users, Activity, ClipboardList } from 'lucide-react';

export const adminNav: MenuItem[] = [
    {
        id: 'dashboard',
        title: 'dashboard',
        icon: Home,
        children: [
            { id: 'monitoring', title: 'monitoring', path: '/admin/fleet/monitoring' },
        ]
    },
    {
        id: 'fleet',
        title: 'fleet',
        icon: Truck,
        children: [
            { id: 'tasks', title: 'tasks', path: '/admin/fleet/tasks' },
            { id: 'vehicles', title: 'vehicles', path: '/admin/fleet/vehicles' },
            { id: 'hubs', title: 'hubs', path: '/admin/fleet/hubs' },
            { id: 'customers', title: 'customers', path: '/admin/fleet/customers' },
        ]
    }
];
