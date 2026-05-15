import { MenuItem } from '@/types/nav';
import { Building, LayoutGrid, Map as MapIcon, Settings, User as UserIcon, Banknote, ShieldCheck } from 'lucide-react';

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
        id: 'user_management',
        title: 'user_management',
        icon: UserIcon,
        path: '/system/users'
    },
    {
        id: 'platform_team',
        title: 'platform_team',
        icon: ShieldCheck, 
        path: '/system/staff'
    },
    {
        id: 'exchange_rate_management',
        title: 'exchange_rate_management',
        icon: Banknote,
        path: '/system/exchange-rates'
    },
    {
        id: 'hub_management',
        title: 'hub_management',
        icon: MapIcon,
        path: '/system/hubs'
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
            { id: 'static_map', title: 'static_route', path: '/system/demomap/static' },
            { id: 'interactive_map', title: 'interactive_map', path: '/system/demomap/interactive' },
            { id: 'map_marker', title: 'map_marker', path: '/system/demomap/marker' },
            { id: 'delivery_tracking', title: 'delivery_tracking', path: '/system/demomap/delivery' },
            { id: 'available_driver', title: 'available_driver', path: '/system/demomap/available-driver' },
            { id: 'realtime_tracking', title: 'realtime_tracking', path: '/system/demomap/realtime' },
        ]
    }
];
