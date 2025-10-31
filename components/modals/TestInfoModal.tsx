import React from 'react';
import { Test } from '../../types';
import { ClipboardList, X, Info } from 'lucide-react';

interface TestInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: () => void;
    onStartPractice: () => void;
    test: Test;
}

const TestInfoModal: React.FC<TestInfoModalProps> = ({ isOpen, onClose, onStart, onStartPractice, test }) => {
    if (!isOpen) return null;

    const totalMarks = (test.questionCount || 0) * (test.marksPerQuestion || 1);

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-8 text-center animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end">
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 -mt-4 -mr-4"><X /></button>
                </div>
                <ClipboardList className="w-16 h-16 text-indigo-500 dark:text-indigo-400 mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 dark:text-gray-100">{test.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-left mb-8">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"><p className="text-sm text-gray-500 dark:text-gray-400">Total Questions</p><p className="text-xl sm:text-2xl font-bold dark:text-gray-200">{test.questionCount}</p></div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"><p className="text-sm text-gray-500 dark:text-gray-400">Total Marks</p><p className="text-xl sm:text-2xl font-bold dark:text-gray-200">{totalMarks}</p></div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"><p className="text-sm text-gray-500 dark:text-gray-400">Duration</p><p className="text-xl sm:text-2xl font-bold dark:text-gray-200">{test.durationMinutes} Mins</p></div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"><p className="text-sm text-gray-500 dark:text-gray-400">Negative Marking</p><p className="text-xl sm:text-2xl font-bold dark:text-gray-200">{test.negativeMarking}</p></div>
                </div>

                <div className="text-left bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-500/50 my-8">
                    <h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-300 mb-3 flex items-center"><Info className="w-5 h-5 mr-2"/>Instructions</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>This is a timed test. Please complete it within the allocated duration.</li>
                        <li>Each question has only one correct option.</li>
                        <li>Do not refresh the page or use the browser's back button during the test.</li>
                        <li>Your test will be automatically submitted when the time is up.</li>
                        <li>All the best!</li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={onStartPractice} className="w-full py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg">
                        Practice Mode
                    </button>
                    <button onClick={onStart} className="w-full py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-all shadow-lg">Start Timed Test</button>
                </div>
            </div>
        </div>
    );
};

export default TestInfoModal;