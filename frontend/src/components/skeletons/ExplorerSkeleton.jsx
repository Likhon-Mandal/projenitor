import React from 'react';

const ExplorerSkeleton = () => {
    return (
        <div className="w-full space-y-6 animate-pulse font-sans">
            {/* Top Search & Filter Bar Skeleton */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="h-12 flex-1 bg-stone-100 rounded-2xl w-full" />
                    <div className="h-12 w-full sm:w-36 bg-orange-200/60 rounded-2xl" />
                </div>
                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-8 w-24 bg-stone-100 rounded-full shrink-0" />
                    ))}
                </div>
            </div>

            {/* Tree View / Cards Header */}
            <div className="flex items-center justify-between px-2">
                <div className="h-6 w-48 bg-stone-200 rounded-lg" />
                <div className="h-6 w-28 bg-stone-100 rounded-lg" />
            </div>

            {/* Bari / Member Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-orange-100 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-5 w-32 bg-stone-200 rounded" />
                                <div className="h-3 w-20 bg-stone-100 rounded" />
                            </div>
                        </div>
                        <div className="h-px bg-stone-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-3/4 bg-stone-100 rounded" />
                            <div className="h-3.5 w-1/2 bg-stone-100 rounded" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="h-6 w-20 bg-orange-50 rounded-md" />
                            <div className="h-8 w-24 bg-orange-200/70 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExplorerSkeleton;
