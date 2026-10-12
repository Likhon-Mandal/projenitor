import React from 'react';

const HistorySkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse font-sans px-3 sm:px-6">
            {/* Header Banner Skeleton */}
            <div className="text-center space-y-3 mt-4 sm:mt-6">
                <div className="h-6 w-44 bg-orange-200/60 rounded-full mx-auto" />
                <div className="h-10 sm:h-12 w-2/3 bg-orange-300/60 rounded-2xl mx-auto" />
                <div className="h-4 sm:h-5 w-4/5 sm:w-1/2 bg-stone-200 rounded mx-auto" />
            </div>

            {/* Chapter Selection Pills Skeleton */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 w-28 bg-orange-100 rounded-full shrink-0" />
                ))}
            </div>

            {/* Manuscript Cards Skeleton */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-orange-200/60 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="h-7 w-48 bg-stone-200 rounded-lg" />
                            <div className="h-6 w-20 bg-orange-100 rounded-full" />
                        </div>
                        {/* Callout rhyme skeleton */}
                        <div className="p-5 bg-amber-50/80 rounded-2xl border-l-4 border-orange-300 space-y-2">
                            <div className="h-5 w-3/4 bg-amber-200/60 rounded mx-auto" />
                            <div className="h-4 w-1/2 bg-amber-200/40 rounded mx-auto" />
                        </div>
                        {/* Paragraph lines */}
                        <div className="space-y-2.5">
                            <div className="h-4 w-full bg-stone-100 rounded" />
                            <div className="h-4 w-11/12 bg-stone-100 rounded" />
                            <div className="h-4 w-4/5 bg-stone-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistorySkeleton;
