import { createRootRoute, Outlet } from '@tanstack/react-router';
import DefaultLayout from '../components/Layouts/DefaultLayout';

export const rootRoute = createRootRoute({
    component: () => (
        <DefaultLayout>
            <Outlet />
        </DefaultLayout>
    ),
});
