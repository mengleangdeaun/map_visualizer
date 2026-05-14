import { createRootRoute, createRoute, lazyRouteComponent, Outlet, createRouter } from '@tanstack/react-router';
import React from 'react';
import { z } from 'zod';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { AuthGuard } from '../components/shared/auth/AuthGuard';

const ComingSoon = () => (
    <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-primary">Coming Soon</h2>
        <p className="text-muted-foreground">This domain is currently being migrated to the TanStack ecosystem.</p>
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

// 2. Define Layout (With Explicit ID to avoid root collision)
const mainLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'layout',
    component: () => (
        <AuthGuard>
            <DefaultLayout>
                <Outlet />
            </DefaultLayout>
        </AuthGuard>
    ),
});

// 3. Define Auth Routes
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/login', component: lazyRouteComponent(() => import('../domains/auth/pages/Login/index')) });
const lockscreenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/lockscreen', component: lazyRouteComponent(() => import('../domains/auth/pages/LockScreen/index')) });
const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/forgot-password', component: lazyRouteComponent(() => import('../domains/auth/pages/Login/index')) });

// 4. Define Domain Routes
const companySearchSchema = z.object({ page: z.number().catch(1), per_page: z.number().catch(10), search: z.string().optional().catch('') });

const systemDashboardRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system', component: lazyRouteComponent(() => import('../domains/system/pages/Dashboard/index')) });
const systemCompaniesRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system/companies', validateSearch: (search) => companySearchSchema.parse(search), component: lazyRouteComponent(() => import('../domains/system/pages/Company/index')) });
const systemUsersRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system/users', component: lazyRouteComponent(() => import('../domains/system/pages/User/index')) });
const systemSettingsRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system/settings', component: ComingSoon });
const systemExchangeRatesRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system/exchange-rates', component: lazyRouteComponent(() => import('../domains/system/pages/ExchangeRate/index')) });
const systemHubsRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system/hubs', component: lazyRouteComponent(() => import('../domains/system/pages/Location/index')) });
const systemStaffRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'system/staff', component: lazyRouteComponent(() => import('../domains/system/pages/PlatformStaff/index')) });

const adminDashboardRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin', component: lazyRouteComponent(() => import('../domains/admin/pages/Index')) });
const adminVehiclesRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/vehicles', component: lazyRouteComponent(() => import('../domains/admin/pages/Vehicle/index')) });
const adminHubsRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/hubs', component: lazyRouteComponent(() => import('../domains/admin/pages/Hub/index')) });

const indexRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: '/', component: lazyRouteComponent(() => import('../domains/admin/pages/Index')) });
const error404Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error404', component: ComingSoon });

// 5. Construct Tree
const routeTree = rootRoute.addChildren([
    mainLayoutRoute.addChildren([
        indexRoute,
        systemDashboardRoute,
        systemCompaniesRoute,
        systemUsersRoute,
        systemSettingsRoute,
        systemExchangeRatesRoute,
        systemHubsRoute,
        systemStaffRoute,
        adminDashboardRoute,
        adminVehiclesRoute,
        adminHubsRoute,
    ]),
    loginRoute,
    lockscreenRoute,
    forgotPasswordRoute,
    error404Route,
]);

// 6. Create Router
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
});

// 7. Register
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export default router;
