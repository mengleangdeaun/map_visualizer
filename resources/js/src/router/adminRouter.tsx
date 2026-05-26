import { createRootRoute, createRoute, lazyRouteComponent, Outlet, createRouter, useNavigate } from '@tanstack/react-router';
import React from 'react';
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
        <AuthGuard allowedRoles={['admin']}>
            <DefaultLayout>
                <Outlet />
            </DefaultLayout>
        </AuthGuard>
    ),
});

// 3. Define Auth Routes
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/login', component: lazyRouteComponent(() => import('../domains/auth/pages/Login/index')) });
const lockscreenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/lockscreen', component: lazyRouteComponent(() => import('../domains/auth/pages/LockScreen/index')) });
const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/forgot-password', component: lazyRouteComponent(() => import('../domains/auth/pages/ForgotPassword/index')) });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/reset-password', component: lazyRouteComponent(() => import('../domains/auth/pages/ResetPassword/index')) });

// 4. Define Domain Routes
const adminDashboardRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin', component: lazyRouteComponent(() => import('../domains/admin/pages/Index')) });
const adminVehiclesRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/vehicles', component: lazyRouteComponent(() => import('../domains/admin/pages/Vehicle/index')) });
const adminHubsRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/hubs', component: lazyRouteComponent(() => import('../domains/admin/pages/Hub/index')) });
const adminMonitoringRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/monitoring', component: lazyRouteComponent(() => import('../domains/admin/pages/Monitoring/index')) });
const adminCustomersRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/customers', component: lazyRouteComponent(() => import('../domains/admin/pages/Customer/index')) });
const adminTasksRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/tasks', component: lazyRouteComponent(() => import('../domains/admin/pages/Tasks/index')) });
const adminMembersRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/members', component: lazyRouteComponent(() => import('../domains/admin/pages/Member/index')) });
const adminDeliveriesRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/deliveries', component: lazyRouteComponent(() => import('../domains/admin/pages/Delivery/index')) });
const adminDispatchRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/dispatch', component: lazyRouteComponent(() => import('../domains/admin/pages/Dispatch/index')) });
const adminTrackingRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/tracking', component: lazyRouteComponent(() => import('../domains/admin/pages/Tracking/index')) });
const adminDocumentNumberingRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/document-numbering', component: lazyRouteComponent(() => import('../domains/admin/pages/DocumentNumbering/index')) });
const adminTelegramSettingsRoute = createRoute({ getParentRoute: () => mainLayoutRoute, path: 'admin/fleet/telegram-settings', component: lazyRouteComponent(() => import('../domains/admin/pages/TelegramSettings/index')) });

const landingPageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => {
        const navigate = useNavigate();
        React.useEffect(() => {
            navigate({ to: '/admin' });
        }, [navigate]);
        return null;
    }
});

const error404Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error404', component: ComingSoon });

// 5. Construct Tree
const routeTree = rootRoute.addChildren([
    mainLayoutRoute.addChildren([
        adminDashboardRoute,
        adminVehiclesRoute,
        adminHubsRoute,
        adminMonitoringRoute,
        adminCustomersRoute,
        adminTasksRoute,
        adminMembersRoute,
        adminDeliveriesRoute,
        adminDispatchRoute,
        adminTrackingRoute,
        adminDocumentNumberingRoute,
        adminTelegramSettingsRoute,
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
