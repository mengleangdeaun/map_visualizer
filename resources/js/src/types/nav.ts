import { LucideIcon } from 'lucide-react';

export interface MenuItem {
    title: string;
    path?: string;
    icon?: LucideIcon;
    children?: MenuItem[];
    id: string; // Used for collapse state tracking
}

export interface NavigationConfig {
    admin: MenuItem[];
    system: MenuItem[];
}
