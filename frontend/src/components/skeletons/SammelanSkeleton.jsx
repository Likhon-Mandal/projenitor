import React from 'react';

const SammelanSkeleton = () => {
    return (
        <div className="w-full space-y-8 animate-pulse font-sans pb-20">
            {/* Hero Header Skeleton */}
            <div className="bg-gradient-to-r from-orange-200 via-amber-200 to-red-200 py-10 px-4 text-center space-y-3">
                <div className="h-10 sm:h-12 w-2/3 max-w-md bg-orange-300/60 rounded-2xl mx-auto" />
                <div className="h-4 w-4/5 max-w-sm bg-orange-200/80 rounded mx-auto" />
            </div>

            {/* Timeline Cards Skeleton */}
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-2">
                                <div className="h-7 w-52 bg-stone-200 rounded-lg" />
                                <div className="h-4 w-36 bg-orange-100 rounded" />
                            </div>
                            <div className="h-8 w-28 bg-amber-100 rounded-full" />
                        </div>
                        {/* Photo Collage Placeholder */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="h-32 bg-stone-100 rounded-2xl" />
                            <div className="h-32 bg-stone-100 rounded-2xl" />
                            <div className="h-32 bg-stone-100 rounded-2xl hidden sm:block" />
                        </div>
                        {/* Summary lines */}
                        <div className="space-y-2 pt-1">
                            <div className="h-3.5 w-full bg-stone-100 rounded" />
                            <div className="h-3.5 w-3/4 bg-stone-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SammelanSkeleton;
