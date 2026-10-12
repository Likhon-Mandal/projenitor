import React from 'react';

const ProfileSkeleton = () => {
    return (
        <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-pulse font-sans">
            {/* Cover Banner Skeleton */}
            <div className="h-28 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-300 relative" />

            <div className="px-4 sm:px-6 pb-6 relative">
                {/* Avatar Skeleton */}
                <div className="flex flex-col items-center -mt-14 mb-4">
                    <div className="h-28 w-28 bg-white rounded-full p-1.5 shadow-lg mb-3">
                        <div className="h-full w-full rounded-full bg-orange-100 border-2 border-orange-200" />
                    </div>
                    {/* Name & Title */}
                    <div className="h-7 w-48 bg-stone-300 rounded-lg mb-2" />
                    <div className="h-4 w-32 bg-stone-200 rounded mb-4" />
                    {/* Quick Badges */}
                    <div className="flex gap-2">
                        <div className="h-6 w-20 bg-orange-100 rounded-full" />
                        <div className="h-6 w-24 bg-amber-100 rounded-full" />
                    </div>
                </div>

                {/* Details Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                            <div className="h-3.5 w-24 bg-stone-200 rounded" />
                            <div className="h-5 w-40 bg-stone-300 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
