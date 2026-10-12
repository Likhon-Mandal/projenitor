import React from 'react';

const CommitteeSkeleton = () => {
    return (
        <div className="w-full space-y-8 animate-pulse font-sans pb-20">
            {/* Header Banner Skeleton */}
            <div className="bg-gradient-to-br from-orange-200 to-red-200 pt-12 pb-16 px-6 text-center space-y-3">
                <div className="h-6 w-36 bg-orange-300/60 rounded-full mx-auto" />
                <div className="h-10 sm:h-12 w-2/3 max-w-md bg-orange-300/80 rounded-2xl mx-auto" />
                <div className="h-4 w-1/2 max-w-sm bg-orange-200 rounded mx-auto" />
            </div>

            {/* Leadership Top Executive Cards */}
            <div className="max-w-6xl mx-auto px-4 -mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-300/60 shadow-lg flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-orange-100 border-2 border-orange-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-24 bg-amber-100 rounded-full" />
                            <div className="h-6 w-40 bg-stone-200 rounded-lg" />
                            <div className="h-4 w-32 bg-stone-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Committee Members Grid Skeleton */}
            <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
                <div className="h-6 w-40 bg-stone-200 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-stone-100 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 w-28 bg-stone-200 rounded" />
                                <div className="h-3 w-20 bg-stone-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommitteeSkeleton;
