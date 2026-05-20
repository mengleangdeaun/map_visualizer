import { MenuItem } from '@/types/nav';
import { Home, Truck, Users, Activity, ClipboardList, Package, Route as RouteIcon } from 'lucide-react';

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
        id: 'deliveries',
        title: 'deliveries',
        icon: Package,
        children: [
            { id: 'deliveries-list', title: 'deliveries', path: '/admin/fleet/deliveries' },
            { id: 'dispatch', title: 'dispatch', path: '/admin/fleet/dispatch' },
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
            { id: 'users', title: 'users', path: '/admin/fleet/users' },
            { id: 'customers', title: 'customers', path: '/admin/fleet/customers' },
            { id: 'document-numbering', title: 'document_numbering', path: '/admin/fleet/document-numbering' },
        ]
    }
];
