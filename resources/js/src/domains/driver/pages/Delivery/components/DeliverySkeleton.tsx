import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DeliverySkeleton: React.FC = React.memo(() => {
    return (
        <div className="p-4 space-y-4 max-w-md mx-auto">
            <Skeleton className="h-10 w-48 rounded-xl" />
            {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl animate-pulse" />
            ))}
        </div>
    );
});

DeliverySkeleton.displayName = 'DeliverySkeleton';
