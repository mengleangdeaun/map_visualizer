import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const StaticMap = lazy(() => import('../pages/DemoMap/StaticMap/StaticMap'));
const InteractiveMap = lazy(() => import('../pages/DemoMap/InteractiveMap/InteractiveMap'));
const MapMarker = lazy(() => import('../pages/DemoMap/MapMarker/MapMarker'));
const DeliveryTracking = lazy(() => import('../pages/DemoMap/DeliveryTracking/DeliveryTracking'));
const AvailableDriver = lazy(() => import('../pages/DemoMap/AvailableDriver/AvailableDriver'));
const RealtimeTracking = lazy(() => import('../pages/DemoMap/RealtimeTracking/RealtimeTracking'));

const routes = [
    // dashboard
    {
        path: '/',
        element: <Index />,
        layout: 'default',
    },
    {
        path: '/demomap/static',
        element: <StaticMap />,
        layout: 'default',
    },
    {
        path: '/demomap/interactive',
        element: <InteractiveMap />,
        layout: 'default',
    },
    {
        path: '/demomap/marker',
        element: <MapMarker />,
        layout: 'default',
    },
    {
        path: '/demomap/delivery',
        element: <DeliveryTracking />,
        layout: 'default',
    },
    {
        path: '/demomap/available-driver',
        element: <AvailableDriver />,
        layout: 'default',
    },
    {
        path: '/demomap/realtime',
        element: <RealtimeTracking />,
        layout: 'default',
    },
];

export { routes };
