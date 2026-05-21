import React from 'react';

export const TasksSkeleton = React.memo(() => {
    return (
        <div className="flex flex-col gap-3.5 w-full">
            {[1, 2, 3].map((idx) => (
                <div
                    key={idx}
                    className="h-[210px] w-full animate-pulse bg-white shadow-sm rounded-2xl border border-gray-100"
                />
            ))}
        </div>
    );
});

TasksSkeleton.displayName = 'TasksSkeleton';
