import React from 'react';

const SkeletonProfile: React.FC = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-8 flex items-center gap-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div>
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
                   <div className="w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                   <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-3"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
                     <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
                    <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default SkeletonProfile;