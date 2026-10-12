import React from 'react';

const HelpSkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse font-sans pb-12">
            {/* Header section skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-stone-200 rounded-lg" />
                    <div className="h-4 w-64 bg-stone-100 rounded" />
                </div>
                <div className="h-10 w-36 bg-orange-200/70 rounded-2xl" />
            </div>

            {/* Emergency Hotline / Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-4 w-28 bg-stone-200 rounded" />
                            <div className="h-3 w-40 bg-stone-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-24 bg-stone-100 rounded-full shrink-0" />
                ))}
            </div>

            {/* Help Request Cards Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-6 w-24 bg-orange-100 rounded-full" />
                            <div className="h-4 w-20 bg-stone-100 rounded" />
                        </div>
                        <div className="h-5 w-2/3 bg-stone-200 rounded" />
                        <div className="h-3.5 w-full bg-stone-100 rounded" />
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-stone-100" />
                                <div className="h-3.5 w-24 bg-stone-100 rounded" />
                            </div>
                            <div className="h-8 w-28 bg-orange-100 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HelpSkeleton;
