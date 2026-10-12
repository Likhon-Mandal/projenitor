import React from 'react';

const EventsSkeleton = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse font-sans pb-20 px-4">
            {/* Header Banner Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-xs border border-stone-100 gap-4 mt-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 shrink-0" />
                    <div className="space-y-2">
                        <div className="h-6 w-44 bg-stone-200 rounded" />
                        <div className="h-4 w-64 bg-stone-100 rounded" />
                    </div>
                </div>
                <div className="h-10 w-32 bg-orange-200/70 rounded-xl" />
            </div>

            {/* Event & Notice Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="h-6 w-24 bg-orange-100 rounded-full" />
                            <div className="h-4 w-28 bg-stone-100 rounded" />
                        </div>
                        <div className="h-6 w-3/4 bg-stone-200 rounded-lg" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-full bg-stone-100 rounded" />
                            <div className="h-3.5 w-4/5 bg-stone-100 rounded" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="h-4 w-28 bg-stone-100 rounded" />
                            <div className="h-8 w-20 bg-orange-100 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsSkeleton;
