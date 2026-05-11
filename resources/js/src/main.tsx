import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client'


// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from '@tanstack/react-router';
import router from './router/index';

// TanStack Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster position="top-right" richColors />
            </QueryClientProvider>
        </Suspense>
    </React.StrictMode>
);

