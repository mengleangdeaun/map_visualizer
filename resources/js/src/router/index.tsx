import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './root';
import { routeTree } from './routes';

// Create the route tree
const tree = rootRoute.addChildren(routeTree);

// Create the router instance
const router = createRouter({
    routeTree: tree,
    defaultPreload: 'intent',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export default router;
