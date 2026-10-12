import React from 'react';

const HomeSkeleton = () => {
    return (
        <div className="w-full space-y-8 animate-pulse font-sans">
            {/* Hero Section Skeleton */}
            <div className="relative rounded-3xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 border border-orange-200/70 p-6 sm:p-12 overflow-hidden shadow-sm">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    {/* Badge */}
                    <div className="h-6 w-36 bg-orange-200/70 rounded-full mx-auto" />
                    {/* Main Title */}
                    <div className="h-10 sm:h-14 w-3/4 sm:w-2/3 bg-orange-300/60 rounded-2xl mx-auto" />
                    {/* Subtitle */}
                    <div className="h-4 sm:h-5 w-4/5 sm:w-1/2 bg-orange-200/50 rounded-lg mx-auto" />
                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-3">
                        <div className="h-11 w-36 bg-orange-300/80 rounded-2xl" />
                        <div className="h-11 w-36 bg-orange-200/60 rounded-2xl" />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-orange-100" />
                            <div className="w-12 h-4 rounded-full bg-stone-100" />
                        </div>
                        <div className="h-8 w-20 bg-stone-200/80 rounded-lg" />
                        <div className="h-4 w-24 bg-stone-100 rounded" />
                    </div>
                ))}
            </div>

            {/* Notice / Quote Banner Skeleton */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-200/60 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-stone-200 rounded" />
                    <div className="h-3 w-4/5 bg-stone-100 rounded" />
                </div>
                <div className="h-8 w-24 bg-orange-100 rounded-xl hidden sm:block" />
            </div>

            {/* Exploration Modules Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100" />
                        <div className="h-5 w-40 bg-stone-200 rounded-lg" />
                        <div className="space-y-1.5">
                            <div className="h-3.5 w-full bg-stone-100 rounded" />
                            <div className="h-3.5 w-4/5 bg-stone-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeSkeleton;
