import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import DashboardHome from './pages/DashboardHome';
import ManageCategories from './pages/ManageCategories';
import ManageTests from './pages/ManageTests';
import ViewTests from './pages/ViewTests';
import ManagePages from './pages/ManagePages';
import ManageUI from './pages/ManageUI';
import ManageReports from './pages/ManageReports';

export type AdminView = 'dashboard' | 'categories' | 'tests' | 'view-tests' | 'pages' | 'ui-management' | 'reports';

const adminViewTitles: { [key in AdminView]: string } = {
    dashboard: 'Dashboard',
    categories: 'Manage Categories',
    tests: 'Upload Test',
    'view-tests': 'All Tests',
    pages: 'Manage Pages',
    'ui-management': 'Appearance',
    reports: 'Reported Questions',
};

const AdminDashboard: React.FC = () => {
    const [currentView, setCurrentView] = useState<AdminView>('reports');
    const [editingTestId, setEditingTestId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleNavigation = (view: AdminView) => {
        setCurrentView(view);
        setIsSidebarOpen(false); // Close sidebar on mobile after navigation
    };

    const handleEditTest = (testId: string) => {
        setEditingTestId(testId);
        setCurrentView('tests');
    };

    const handleFinishEditing = () => {
        setEditingTestId(null);
        setCurrentView('view-tests');
    };

    const renderContent = () => {
        switch (currentView) {
            case 'categories':
                return <ManageCategories />;
            case 'tests':
                return <ManageTests testIdToEdit={editingTestId} onSaveComplete={handleFinishEditing} />;
            case 'view-tests':
                return <ViewTests onEditTest={handleEditTest} />;
            case 'pages':
                return <ManagePages />;
            case 'ui-management':
                return <ManageUI />;
            case 'reports':
                return <ManageReports />;
            case 'dashboard':
            default:
                return <DashboardHome />;
        }
    };

    return (
        <div className="dark:bg-slate-900">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <AdminSidebar 
                currentView={currentView} 
                onSetView={handleNavigation}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="lg:pl-64">
                <header className="sticky top-16 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                        {adminViewTitles[currentView]}
                    </div>
                </header>

                <main className="py-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;