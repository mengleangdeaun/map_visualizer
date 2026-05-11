import { MenuItem } from '@/types/nav';
import { Building, LayoutGrid, Map as MapIcon, Settings } from 'lucide-react';

export const systemNav: MenuItem[] = [
    {
        id: 'system_dashboard',
        title: 'system_management',
        icon: LayoutGrid,
        path: '/system'
    },
    {
        id: 'company_management',
        title: 'company_management',
        icon: Building,
        path: '/system/companies'
    },
    {
        id: 'system_settings',
        title: 'system_settings',
        icon: Settings,
        path: '/system/settings'
    },
    {
        id: 'map',
        title: 'demo_maps',
        icon: MapIcon,
        children: [
            { id: 'static_map', title: 'static_route', path: '/demomap/static' },
            { id: 'interactive_map', title: 'interactive_map', path: '/demomap/interactive' },
            { id: 'map_marker', title: 'map_marker', path: '/demomap/marker' },
            { id: 'delivery_tracking', title: 'delivery_tracking', path: '/demomap/delivery' },
            { id: 'available_driver', title: 'available_driver', path: '/demomap/available-driver' },
            { id: 'realtime_tracking', title: 'realtime_tracking', path: '/demomap/realtime' },
        ]
    }
];
