import React from 'react';

const EminentSkeleton = () => {
    return (
        <div className="w-full space-y-8 animate-pulse font-sans pb-20">
            {/* Header Banner Skeleton */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-200 pt-10 pb-16 px-6 text-center space-y-3">
                <div className="h-6 w-36 bg-orange-200/80 rounded-full mx-auto" />
                <div className="h-10 sm:h-12 w-2/3 max-w-md bg-orange-300/80 rounded-2xl mx-auto" />
                <div className="h-4 w-1/2 max-w-sm bg-orange-200 rounded mx-auto" />
            </div>

            {/* Category Tabs Skeleton */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 flex items-center justify-center gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-36 sm:w-44 bg-white rounded-2xl shadow-md border border-stone-200 shrink-0" />
                ))}
            </div>

            {/* Awardees Grid Skeleton */}
            <div className="max-w-7xl mx-auto px-4 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-orange-100 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-5 w-32 bg-stone-200 rounded" />
                                <div className="h-4 w-20 bg-amber-100 rounded-md" />
                            </div>
                        </div>
                        <div className="h-px bg-stone-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-full bg-stone-100 rounded" />
                            <div className="h-3.5 w-3/4 bg-stone-100 rounded" />
                        </div>
                        <div className="h-7 w-24 bg-stone-100 rounded-lg pt-1" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EminentSkeleton;
