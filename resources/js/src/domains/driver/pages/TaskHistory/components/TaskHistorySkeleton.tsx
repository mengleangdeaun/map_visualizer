import React from 'react';

export const TaskHistorySkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-3.5">
      {[1, 2, 3, 4].map((idx) => (
        <div
          key={idx}
          className="h-[136px] w-full animate-pulse bg-card/60 border border-muted/20 rounded-2xl"
        />
      ))}
    </div>
  );
});

TaskHistorySkeleton.displayName = 'TaskHistorySkeleton';
