import React, { useState } from 'react';
import { Test, UserResult } from '../../types';
import { FileText, Info } from 'lucide-react';

interface TestCardProps {
    test: Test;
    userResult?: UserResult;
    inProgressTestId?: string;
    onAction: (testId: string, action: 'start' | 'resume' | 'result') => void;
    isNew?: boolean;
}

const TestCard: React.FC<TestCardProps> = ({ test, userResult, inProgressTestId, onAction, isNew }) => {
    const [isInfoVisible, setIsInfoVisible] = useState(false);

    const renderButtons = () => {
        if (inProgressTestId === test.id) {
            return (
                <button onClick={() => onAction(test.id, 'resume')} className="w-full mt-auto py-2.5 px-4 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition">
                    Resume Test
                </button>
            );
        }
        if (userResult) {
            return (
                <div className="mt-auto grid grid-cols-2 gap-2">
                    <button onClick={() => onAction(test.id, 'result')} className="w-full py-2.5 px-2 bg-green-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition">
                        View Result
                    </button>
                    <button onClick={() => onAction(test.id, 'start')} className="w-full py-2.5 px-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                        Reattempt
                    </button>
                </div>
            );
        }
        return (
            <button onClick={() => onAction(test.id, 'start')} className="w-full mt-auto py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                Attempt Now
            </button>
        );
    };

    return (
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col">
            {isNew && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white shadow-lg animate-pulse-badge">
                        NEW
                    </span>
                </div>
            )}
            <div
                className="absolute top-4 right-4"
                onMouseEnter={() => setIsInfoVisible(true)}
                onMouseLeave={() => setIsInfoVisible(false)}
            >
                <div className="relative">
                    <Info className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer" />
                    {isInfoVisible && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg z-10 animate-fade-in">
                            <p><strong>Marks per question:</strong> {test.marksPerQuestion}</p>
                            <p><strong>Negative marking:</strong> {test.negativeMarking}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow">
                <FileText className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2 pr-6 truncate text-gray-900 dark:text-gray-100" title={test.title}>{test.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{test.questionCount || 0} questions | {test.durationMinutes || 60} mins</p>
            </div>
            {renderButtons()}
        </div>
    );
};

export default TestCard;