import { z } from 'zod';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from '../../router/root';

const companySearchSchema = z.object({
    page: z.number().catch(1),
    per_page: z.number().catch(10),
    search: z.string().optional().catch(''),
});

export const systemRoutes = [
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/system',
        component: lazyRouteComponent(() => import('./pages/Dashboard')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/system/companies',
        validateSearch: (search) => companySearchSchema.parse(search),
        component: lazyRouteComponent(() => import('./pages/Company')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/system/users',
        component: lazyRouteComponent(() => import('./pages/Dashboard')), // Placeholder
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/system/settings',
        component: lazyRouteComponent(() => import('./pages/Dashboard')), // Placeholder
    }),
    // Demo Map Routes (Moved to System Domain)
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/demomap/static',
        component: lazyRouteComponent(() => import('./pages/DemoMap/StaticMap/StaticMap')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/demomap/interactive',
        component: lazyRouteComponent(() => import('./pages/DemoMap/InteractiveMap/InteractiveMap')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/demomap/marker',
        component: lazyRouteComponent(() => import('./pages/DemoMap/MapMarker/MapMarker')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/demomap/delivery',
        component: lazyRouteComponent(() => import('./pages/DemoMap/DeliveryTracking/DeliveryTracking')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/demomap/available-driver',
        component: lazyRouteComponent(() => import('./pages/DemoMap/AvailableDriver/AvailableDriver')),
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        path: '/demomap/realtime',
        component: lazyRouteComponent(() => import('./pages/DemoMap/RealtimeTracking/RealtimeTracking')),
    }),
];
