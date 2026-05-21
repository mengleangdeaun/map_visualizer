import React from 'react';

export const DeliveryHistorySkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="w-full bg-white shadow-sm rounded-2xl animate-pulse overflow-hidden"
        >
          {/* Header shimmer */}
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gray-100" />
              <div className="flex flex-col gap-1.5">
                <div className="h-2 w-14 bg-gray-100 rounded-full" />
                <div className="h-3 w-28 bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          {/* Body shimmer */}
          <div className="p-4 flex flex-col gap-3">
            <div className="bg-gray-50 p-3 rounded-xl flex flex-col gap-2">
              <div className="h-2.5 w-32 bg-gray-200 rounded-full" />
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-1.5 w-10 bg-gray-100 rounded-full" />
                    <div className="h-3 w-14 bg-gray-200 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 pt-2">
              <div className="h-5 w-24 bg-gray-100 rounded-full" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

DeliveryHistorySkeleton.displayName = 'DeliveryHistorySkeleton';
