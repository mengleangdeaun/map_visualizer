import { createRootRoute, createRoute, lazyRouteComponent, Outlet, createRouter } from '@tanstack/react-router';
import React from 'react';
import { z } from 'zod';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { AuthGuard } from '../components/shared/auth/AuthGuard';

const ComingSoon = () => (
    <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-primary">Coming Soon</h2>
        <p className="text-muted-foreground">This domain is currently being migrated.</p>
    </div>
);

// 1. Define Root
const rootRoute = createRootRoute({
    component: () => (
        <div className="antialiased">
            <Outlet />
        </div>
    ),
});

// 2. Define Layout (restricted to super_admin and system_staff)
const systemLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'system-layout',
    component: () => (
        <AuthGuard allowedRoles={['super_admin', 'system_staff']}>
            <DefaultLayout>
                <Outlet />
            </DefaultLayout>
        </AuthGuard>
    ),
});

// 3. Define Auth Routes (shares auth templates)
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/login', component: lazyRouteComponent(() => import('../domains/auth/pages/Login/index')) });
const lockscreenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/lockscreen', component: lazyRouteComponent(() => import('../domains/auth/pages/LockScreen/index')) });
const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/forgot-password', component: lazyRouteComponent(() => import('../domains/auth/pages/ForgotPassword/index')) });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/reset-password', component: lazyRouteComponent(() => import('../domains/auth/pages/ResetPassword/index')) });

const companySearchSchema = z.object({ page: z.number().catch(1), per_page: z.number().catch(10), search: z.string().optional().catch('') });

// 4. Define SaaS Platform routes
const systemDashboardRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system', component: lazyRouteComponent(() => import('../domains/system/pages/Dashboard/index')) });
const systemCompaniesRoute = createRoute({
    getParentRoute: () => systemLayoutRoute,
    path: 'system/companies',
    validateSearch: (search) => companySearchSchema.parse(search),
    component: lazyRouteComponent(() => import('../domains/system/pages/Company/index'))
});
const systemUsersRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/users', component: lazyRouteComponent(() => import('../domains/system/pages/User/index')) });
const systemSettingsRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/settings', component: lazyRouteComponent(() => import('../domains/system/pages/Settings/index')) });
const systemExchangeRatesRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/exchange-rates', component: lazyRouteComponent(() => import('../domains/system/pages/Settings/index')) });
const systemHubsRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/hubs', component: lazyRouteComponent(() => import('../domains/system/pages/Location/index')) });
const systemStaffRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/staff', component: lazyRouteComponent(() => import('../domains/system/pages/PlatformStaff/index')) });
const systemTelegramBotRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/telegram-bot', component: lazyRouteComponent(() => import('../domains/system/pages/TelegramBot/index')) });

// Demo Map routes
const systemDemoStaticRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/demomap/static', component: lazyRouteComponent(() => import('../domains/system/pages/DemoMap/StaticMap/StaticMap')) });
const systemDemoInteractiveRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/demomap/interactive', component: lazyRouteComponent(() => import('../domains/system/pages/DemoMap/InteractiveMap/InteractiveMap')) });
const systemDemoMarkerRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/demomap/marker', component: lazyRouteComponent(() => import('../domains/system/pages/DemoMap/MapMarker/MapMarker')) });
const systemDemoDeliveryRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/demomap/delivery', component: lazyRouteComponent(() => import('../domains/system/pages/DemoMap/DeliveryTracking/DeliveryTracking')) });
const systemDemoAvailableDriverRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/demomap/available-driver', component: lazyRouteComponent(() => import('../domains/system/pages/DemoMap/AvailableDriver/AvailableDriver')) });
const systemDemoRealtimeRoute = createRoute({ getParentRoute: () => systemLayoutRoute, path: 'system/demomap/realtime', component: lazyRouteComponent(() => import('../domains/system/pages/DemoMap/RealtimeTracking/RealtimeTracking')) });

const landingPageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => {
        // Platform level redirect to system dashboard
        React.useEffect(() => {
            window.location.href = '/system';
        }, []);
        return null;
    }
});

const error404Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error404', component: ComingSoon });

// 5. Construct Tree
const routeTree = rootRoute.addChildren([
    systemLayoutRoute.addChildren([
        systemDashboardRoute,
        systemCompaniesRoute,
        systemUsersRoute,
        systemTelegramBotRoute,
        systemSettingsRoute,
        systemExchangeRatesRoute,
        systemHubsRoute,
        systemStaffRoute,
        systemDemoStaticRoute,
        systemDemoInteractiveRoute,
        systemDemoMarkerRoute,
        systemDemoDeliveryRoute,
        systemDemoAvailableDriverRoute,
        systemDemoRealtimeRoute,
    ]),
    loginRoute,
    lockscreenRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    error404Route,
    landingPageRoute,
]);

// 6. Create Router
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
});

// 7. Export Router
export default router;
