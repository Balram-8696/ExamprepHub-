import React from 'react';

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex-grow">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-3 animate-shimmer"></div>
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-shimmer"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-shimmer"></div>
        </div>
        <div className="h-11 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-shimmer"></div>
    </div>
);

export default SkeletonCard;