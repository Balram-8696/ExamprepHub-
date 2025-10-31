import React, { useState, useContext, useRef, useEffect } from 'react';
import { LogIn, User as UserIcon, KeyRound, LogOut, ListChecks, Menu, Shield, User as UserViewIcon, BarChartHorizontal, Search } from 'lucide-react';
import { AuthContext, ViewType } from '../../App';
import AuthModal from '../modals/AuthModal';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { showMessage } from '../../utils/helpers';

interface HeaderProps {
    onNavigate: (view: ViewType | string) => void;
    onMenuClick: () => void;
    isAdminView: boolean;
    onSwitchToUserView: () => void;
    searchQuery: string;
    onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onMenuClick, isAdminView, onSwitchToUserView, searchQuery, onSearch }) => {
    const { user, userProfile } = useContext(AuthContext);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        signOut(auth).then(() => {
            showMessage('You have been logged out.');
            onNavigate('home');
        }).catch((error) => {
            showMessage(`Logout failed: ${error.message}`, true);
        });
        setProfileDropdownOpen(false);
    };

    return (
        <>
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 h-16 flex justify-between items-center gap-4">
                    <div className="flex items-center space-x-3">
                         {!isAdminView && (
                            <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden" aria-label="Open menu">
                                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </button>
                         )}
                        <button onClick={() => onNavigate('home')} className="flex items-center space-x-3">
                            <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">Exam<span className="text-gray-900 dark:text-gray-100">Hub</span></div>
                        </button>
                    </div>
                    
                    {!isAdminView && (
                         <div className="flex-1 max-w-lg">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for a test..."
                                    value={searchQuery}
                                    onChange={(e) => onSearch(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {isAdminView && (
                            <button onClick={onSwitchToUserView} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition-all flex items-center gap-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                                <UserViewIcon size={16} />
                                User View
                            </button>
                        )}
                        {!user ? (
                            <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <LogIn size={16} />
                                Login
                            </button>
                        ) : (
                            <div ref={profileMenuRef} className="relative">
                                <button onClick={() => setProfileDropdownOpen(prev => !prev)} className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition">
                                    <UserIcon className="w-5 h-5" />
                                </button>
                                {profileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 z-50 origin-top-right border border-gray-100 dark:border-gray-700 animate-scale-in">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{userProfile?.name || user.email}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        {userProfile?.role === 'admin' && (
                                            <button onClick={() => { onNavigate('admin'); setProfileDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <Shield className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" /> Admin Dashboard
                                            </button>
                                        )}
                                        <button onClick={() => { onNavigate('profile'); setProfileDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <BarChartHorizontal className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" /> My Profile
                                        </button>
                                        <button onClick={() => { setPasswordModalOpen(true); setProfileDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <KeyRound className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />Change Password
                                        </button>
                                        <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <LogOut className="w-4 h-4 mr-2" />Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            {user && <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />}
        </>
    );
};

export default Header;