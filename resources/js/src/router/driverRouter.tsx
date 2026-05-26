import { createRootRoute, createRoute, lazyRouteComponent, Outlet, createRouter, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { MobileLayout } from '../domains/driver/components/Layout/MobileLayout';
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
const driverLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'driver-layout',
    component: () => (
        <AuthGuard allowedRoles={['driver']}>
            <MobileLayout />
        </AuthGuard>
    ),
});

// 3. Define Driver Auth Routes
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/driver/login', component: lazyRouteComponent(() => import('../domains/auth/pages/Login/index')) });
const lockscreenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/driver/lockscreen', component: lazyRouteComponent(() => import('../domains/auth/pages/LockScreen/index')) });
const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/driver/forgot-password', component: lazyRouteComponent(() => import('../domains/auth/pages/ForgotPassword/index')) });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/driver/reset-password', component: lazyRouteComponent(() => import('../domains/auth/pages/ResetPassword/index')) });

// 4. Define Domain Routes
const driverDashboardRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver', component: lazyRouteComponent(() => import('../domains/driver/pages/Dashboard/index')) });
const driverDeliveriesRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/deliveries', component: lazyRouteComponent(() => import('../domains/driver/pages/Delivery/index')) });
const driverTasksRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/tasks', component: lazyRouteComponent(() => import('../domains/driver/pages/Tasks/index')) });
const driverNotificationsRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/notifications', component: lazyRouteComponent(() => import('../domains/driver/pages/Notification/index')) });
const driverProfileRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/profile', component: lazyRouteComponent(() => import('../domains/driver/pages/Profile/index')) });
const driverSettingsRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/settings', component: lazyRouteComponent(() => import('../domains/driver/pages/Settings/index')) });
const driverTaskHistoryRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/task-history', component: lazyRouteComponent(() => import('../domains/driver/pages/TaskHistory/index')) });
const driverDeliveryHistoryRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/delivery-history', component: lazyRouteComponent(() => import('../domains/driver/pages/DeliveryHistory/index')) });

// Multi-Stop Delivery & Map Routes
const driverMapRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/map', component: lazyRouteComponent(() => import('../domains/driver/pages/Map/index')) });
const driverRouteFeedRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/route', component: lazyRouteComponent(() => import('../domains/driver/pages/RouteFeed/index')) });
const driverStopDetailsRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/route/stop/$id', component: lazyRouteComponent(() => import('../domains/driver/pages/StopDetails/index')) });
const driverPODRoute = createRoute({ getParentRoute: () => driverLayoutRoute, path: 'driver/route/stop/$id/pod', component: lazyRouteComponent(() => import('../domains/driver/pages/PODForm/index')) });

const landingPageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => {
        const navigate = useNavigate();
        React.useEffect(() => {
            navigate({ to: '/driver' });
        }, [navigate]);
        return null;
    }
});

const error404Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error404', component: ComingSoon });

// 5. Construct Tree
const routeTree = rootRoute.addChildren([
    landingPageRoute,
    loginRoute,
    lockscreenRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    error404Route,
    driverLayoutRoute.addChildren([
        driverDashboardRoute,
        driverDeliveriesRoute,
        driverTasksRoute,
        driverNotificationsRoute,
        driverProfileRoute,
        driverSettingsRoute,
        driverTaskHistoryRoute,
        driverDeliveryHistoryRoute,
        driverMapRoute,
        driverRouteFeedRoute,
        driverStopDetailsRoute,
        driverPODRoute,
    ]),
]);

// 6. Create Router
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
});

// 7. Export Router
export default router;

