import React, { useContext } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AuthContext } from '../../App';
import { UserResult } from '../../types';
import { showMessage } from '../../utils/helpers';
import { User, Inbox, Award, TrendingUp, BookOpen, ArrowLeft } from 'lucide-react';
import SkeletonProfile from '../skeletons/SkeletonProfile';

const RadialProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
            <circle cx="60" cy="60" r={radius} strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-700" fill="transparent" />
            <circle
                cx="60"
                cy="60"
                r={radius}
                strokeWidth="10"
                className="stroke-current text-indigo-500"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="transform rotate-90 origin-center text-2xl font-bold fill-current text-gray-700 dark:text-gray-200">
                {`${percentage.toFixed(1)}%`}
            </text>
        </svg>
    );
};

interface ProfilePageProps {
    onNavigate: (view: string) => void;
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onBack }) => {
    const { user, userProfile } = useContext(AuthContext);
    const [results, setResults] = React.useState<UserResult[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (user) {
            setLoading(true);
            const q = query(collection(db, 'results'), where("userId", "==", user.uid), orderBy('submittedAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserResult));
                setResults(resultsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching results:", error);
                showMessage("Failed to load your profile data.", true);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setResults([]);
            setLoading(false);
        }
    }, [user]);

    const stats = React.useMemo(() => {
        const totalTests = results.length;
        if (totalTests === 0) return { totalTests: 0, averageScore: 0, bestCategory: { name: 'N/A' }, highestScore: 0 };

        const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalTests;
        const highestScore = Math.max(...results.map(r => r.percentage));

        const categoryPerformance = results.reduce((acc, result) => {
            const cat = acc.get(result.categoryName) || { total: 0, count: 0 };
            cat.total += result.percentage;
            cat.count++;
            acc.set(result.categoryName, cat);
            return acc;
        }, new Map<string, { total: number, count: number }>());
        
        let bestCategory = { name: 'N/A', avg: 0 };
        categoryPerformance.forEach((data, name) => {
            const avg = data.total / data.count;
            if (avg > bestCategory.avg) {
                bestCategory = { name, avg };
            }
        });
        
        return { totalTests, averageScore, bestCategory, highestScore };
    }, [results]);

    if (loading) {
        return <SkeletonProfile />;
    }
    
    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                 <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Please Log In</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Log in to view your profile and performance statistics.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-8 border-t-4 border-indigo-500 flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        Welcome, {userProfile?.name || user.email?.split('@')[0]}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Here is a summary of your performance.</p>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <Inbox className="w-16 h-16 text-gray-400 mx-auto" />
                    <h3 className="text-xl font-semibold mt-4 text-gray-800 dark:text-gray-100">No Data Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Complete some tests to see your performance statistics here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
                           <RadialProgress percentage={stats.averageScore} />
                           <p className="text-lg font-bold mt-2 text-gray-800 dark:text-gray-200">Average Score</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full"><BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tests Taken</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats.totalTests}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full"><Award className="w-7 h-7 text-green-600 dark:text-green-400"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Highest Score</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats.highestScore.toFixed(2)}%</p>
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full"><TrendingUp className="w-7 h-7 text-purple-600 dark:text-purple-400"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Best Category</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate">{stats.bestCategory.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;