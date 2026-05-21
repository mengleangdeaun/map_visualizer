import React from 'react';

export const TaskHistorySkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      {[1, 2, 3, 4].map((idx) => (
        <div
          key={idx}
          className="h-[148px] w-full animate-pulse bg-white shadow-sm rounded-2xl border-none"
        />
      ))}
    </div>
  );
});

TaskHistorySkeleton.displayName = 'TaskHistorySkeleton';
