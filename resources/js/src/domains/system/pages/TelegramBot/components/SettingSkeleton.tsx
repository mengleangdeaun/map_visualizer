import React from "react";
// Adjust the import path below to match your project's UI components directory
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-full p-5">
      {/* Left Column: Contains 2 Boxes */}
      <div className="flex flex-col gap-6 h-full">
        
        {/* Box 1: Bot Connection & Channel Mapping */}
        <div className="border border-zinc-200 bg-zinc-50 p-6 rounded-xl flex flex-col gap-4 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2 mt-2">
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Box 2: Multi-Channel Triggers */}
        <div className="border border-zinc-200 bg-zinc-50 p-6 rounded-xl flex flex-col gap-4 flex-1">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
          
          {/* Trigger Item 1 */}
          <div className="flex justify-between items-center mt-2 border-t border-zinc-200 pt-4">
            <div className="space-y-2 w-2/3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>

          {/* Trigger Item 2 */}
          <div className="flex justify-between items-center border-t border-zinc-200 pt-4">
            <div className="space-y-2 w-2/3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right Column: Contains 1 Box */}
      <div className="border border-zinc-200 bg-zinc-50 p-6 rounded-xl flex flex-col gap-4 h-full">
        {/* Box 3: Super Admin Event Gatekeeping Header */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        
        {/* Inner list items skeleton */}
        <div className="space-y-3 mt-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 items-start border border-zinc-100 p-3 rounded-lg bg-white">
              <Skeleton className="h-5 w-5 rounded mt-0.5" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
