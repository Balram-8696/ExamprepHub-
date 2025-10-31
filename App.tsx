import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './components/pages/HomePage';
import TestView from './components/pages/TestView';
import HistoryPage from './components/pages/HistoryPage';
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import PrivacyPolicyPage from './components/pages/PrivacyPolicyPage';
import CustomPageView from './components/pages/CustomPageView';
import MobileMenu from './components/layout/MobileMenu';
import AdminDashboard from './components/admin/AdminDashboard';
import ProfilePage from './components/pages/ProfilePage';
import Breadcrumbs from './components/layout/Breadcrumbs';
import { Test, UserResult, Category, UserProfile, FooterLink } from './types';
import { showMessage } from './utils/helpers';

export type ViewType = 'home' | 'history' | 'about' | 'contact' | 'privacy' | 'admin' | 'profile';
export const AuthContext = React.createContext<{ user: User | null, userProfile: UserProfile | null }>({ user: null, userProfile: null });

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [view, setView] = useState<ViewType>('home');
    const [lastView, setLastView] = useState<ViewType>('home');
    const [isAdminView, setIsAdminView] = useState(false);
    const [activeTestData, setActiveTestData] = useState<{ test: Test, action: 'start' | 'resume' | 'result' | 'practice', resultData?: UserResult } | null>(null);
    const [activePageSlug, setActivePageSlug] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string }>({ id: '', name: 'All Tests' });
    const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
    
    // Breadcrumb state
    const [breadcrumbs, setBreadcrumbs] = useState<{ label: string, path?: string }[]>([]);
    const [customPageTitle, setCustomPageTitle] = useState<string | null>(null);

    useEffect(() => {
        const stylesDocRef = doc(db, 'uiSettings', 'dynamicStyles');
        const unsubscribe = onSnapshot(stylesDocRef, (docSnap) => {
            const existingStyleElement = document.getElementById('live-dynamic-styles');
            if (existingStyleElement) {
                existingStyleElement.remove();
            }

            if (docSnap.exists()) {
                const css = docSnap.data().css;
                if (css) {
                    const styleElement = document.createElement('style');
                    styleElement.id = 'live-dynamic-styles';
                    styleElement.innerHTML = css;
                    document.head.appendChild(styleElement);
                }
            }
        }, (error) => {
            console.error("Could not listen to dynamic UI styles:", error);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                const isDefaultAdmin = currentUser.email === 'resotainofficial@gmail.com';

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const profile: UserProfile = {
                        uid: currentUser.uid,
                        email: data.email,
                        role: isDefaultAdmin ? 'admin' : data.role,
                        createdAt: data.createdAt,
                        name: data.name || currentUser.displayName || currentUser.email!.split('@')[0],
                    };
                    setUserProfile(profile);
                } else {
                    const role = isDefaultAdmin ? 'admin' : 'user';
                    const name = currentUser.displayName || currentUser.email!.split('@')[0];
                    const newProfile: UserProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email!,
                        name: name,
                        role: role,
                        createdAt: serverTimestamp() as any
                    };
                    setUserProfile(newProfile);
                    await setDoc(userDocRef, {
                        name: name,
                        email: currentUser.email,
                        createdAt: serverTimestamp(),
                        role: role,
                    });
                }
            } else {
                setUserProfile(null);
                setIsAdminView(false);
            }
        });

        const qCategories = query(collection(db, 'testCategories'), orderBy('name'));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoadingCategories(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            showMessage("Error: Could not load categories.", true);
            setLoadingCategories(false);
        });
        
        const footerConfigRef = doc(db, 'uiSettings', 'footer');
        const unsubscribeFooter = onSnapshot(footerConfigRef, (doc) => {
            if (doc.exists()) {
                setFooterLinks(doc.data().links || []);
            } else {
                 setFooterLinks([
                    { label: 'Home', path: 'home' },
                    { label: 'My Results', path: 'history' },
                    { label: 'About Us', path: 'about' },
                    { label: 'Contact Us', path: 'contact' },
                    { label: 'Privacy Policy', path: 'privacy' },
                 ]);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeCategories();
            unsubscribeFooter();
        };
    }, []);

     useEffect(() => {
        const newBreadcrumbs: { label: string, path?: string }[] = [{ label: 'Home', path: 'home' }];

        const findCategoryPath = (catId: string, allCats: Category[]): Category[] => {
            const path: Category[] = [];
            let currentCat = allCats.find(c => c.id === catId);
            while (currentCat) {
                path.unshift(currentCat);
                currentCat = allCats.find(c => c.id === currentCat?.parentId);
            }
            return path;
        };

        if (isAdminView) {
            newBreadcrumbs.push({ label: 'Admin Dashboard' });
        } else if (activeTestData) {
            if (activeTestData.action === 'result' && view === 'history') {
                newBreadcrumbs.push({ label: 'My Results', path: 'history' });
            }
            newBreadcrumbs.push({ label: activeTestData.test.title });
        } else if (activePageSlug) {
            newBreadcrumbs.push({ label: customPageTitle || '...' });
        } else {
            switch(view) {
                case 'home':
                    if (selectedCategory.id) {
                        newBreadcrumbs.push({ label: 'Test Categories', path: 'home' });
                        const categoryPath = findCategoryPath(selectedCategory.id, categories);
                        categoryPath.forEach(cat => {
                            newBreadcrumbs.push({ label: cat.name, path: `category:${cat.id}` });
                        });
                    }
                    break;
                case 'history':
                    newBreadcrumbs.push({ label: 'My Results' });
                    break;
                case 'about':
                    newBreadcrumbs.push({ label: 'About Us' });
                    break;
                case 'contact':
                    newBreadcrumbs.push({ label: 'Contact Us' });
                    break;
                case 'privacy':
                    newBreadcrumbs.push({ label: 'Privacy Policy' });
                    break;
                case 'profile':
                    newBreadcrumbs.push({ label: 'My Profile' });
                    break;
            }
        }

        setBreadcrumbs(newBreadcrumbs);
    }, [view, isAdminView, activeTestData, activePageSlug, selectedCategory, categories, customPageTitle]);
    
    const staticViews: ViewType[] = ['home', 'history', 'about', 'contact', 'privacy', 'admin', 'profile'];

    const handleNavigation = (newView: string, isBackAction = false) => {
        if (!isBackAction && view !== newView && !isAdminView) {
            setLastView(view);
        }

        if (newView.startsWith('category:')) {
            const catId = newView.split(':')[1];
            const category = categories.find(c => c.id === catId);
            if (category) {
                setSelectedCategory({ id: catId, name: category.name });
                if (view !== 'home' || activeTestData || activePageSlug) {
                     setActiveTestData(null);
                     setActivePageSlug(null);
                     setIsAdminView(false);
                     setView('home');
                }
            }
            return;
        }

        setActiveTestData(null);
        setActivePageSlug(null);
        setSearchQuery('');
        setCustomPageTitle(null);

        if (staticViews.includes(newView as ViewType)) {
            if (newView === 'admin') {
                if (userProfile?.role === 'admin') {
                    setIsAdminView(true);
                } else {
                    showMessage("You do not have permission to access this area.", true);
                }
            } else {
                setIsAdminView(false);
                setView(newView as ViewType);
            }
        } else {
            setIsAdminView(false);
            setView('home'); // Reset main view
            setActivePageSlug(newView);
        }
    };
    
    const handleBack = () => handleNavigation(lastView, true);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (view !== 'home' || activeTestData || activePageSlug) {
            setActiveTestData(null);
            setActivePageSlug(null);
            setIsAdminView(false);
            setView('home');
        }
    };


    const initiateTestView = (details: { test: Test, action: 'start' | 'resume' | 'result' | 'practice', resultData?: UserResult }) => {
        setActivePageSlug(null);
        setActiveTestData(details);
        setIsMobileMenuOpen(false);
    };

    const exitTestView = () => {
        setActiveTestData(null);
    };
    
    const handleMobileCategorySelect = (category: { id: string; name: string }) => {
        setSelectedCategory(category);
        setView('home');
        setActivePageSlug(null);
        setIsMobileMenuOpen(false);
    };

    const renderContent = () => {
        if (isAdminView && userProfile?.role === 'admin') {
            return <AdminDashboard />;
        }
        
        if (activeTestData) {
            return (
                <TestView 
                    test={activeTestData.test} 
                    action={activeTestData.action}
                    resultData={activeTestData.resultData}
                    onExitTestView={exitTestView} 
                />
            );
        }

        if (activePageSlug) {
            return <CustomPageView slug={activePageSlug} onNavigate={handleNavigation} onBack={handleBack} onPageLoad={setCustomPageTitle} />;
        }
        
        switch(view) {
            case 'history':
                return <HistoryPage onInitiateTestView={initiateTestView} />;
            case 'about':
                return <AboutPage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'contact':
                return <ContactPage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'privacy':
                return <PrivacyPolicyPage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'profile':
                return <ProfilePage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'home':
            default:
                return <HomePage 
                    onInitiateTestView={initiateTestView} 
                    categories={categories}
                    loadingCategories={loadingCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    searchQuery={searchQuery}
                    onNavigate={handleNavigation}
                />;
        }
    };
    
    const showFooter = view === 'home' && !isAdminView && !activeTestData && !activePageSlug;

    return (
        <AuthContext.Provider value={{ user, userProfile }}>
            <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
                {!activeTestData &&
                    <Header 
                        onNavigate={handleNavigation} 
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                        isAdminView={isAdminView}
                        onSwitchToUserView={() => {
                            setIsAdminView(false);
                            setView('home');
                            setActivePageSlug(null);
                        }}
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                    />
                }
                {!isAdminView && !activeTestData && <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigation} />}
                {!isAdminView && (
                    <MobileMenu 
                        isOpen={isMobileMenuOpen}
                        onClose={() => setIsMobileMenuOpen(false)}
                        categories={categories}
                        loading={loadingCategories}
                        onSelectCategory={handleMobileCategorySelect}
                    />
                )}
                <main className="flex-grow">
                    {renderContent()}
                </main>
                {showFooter && <Footer onNavigate={handleNavigation} links={footerLinks} />}
            </div>
        </AuthContext.Provider>
    );
};

const AppWrapper: React.FC = () => (
    <App />
);

export default AppWrapper;