import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, 
  FileText, 
  Plus, 
  EyeOff, 
  User,
  Home,
  Search,
  ScrollText,
  Menu,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ClerkLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems: { path: string; icon: LucideIcon; label: string }[] = [
    { path: '/clerk-dashboard', icon: Home, label: 'Dashboard' },
    { path: '/clerk-dashboard/create-tappal', icon: Plus, label: 'Create Tappal' },
    { path: '/clerk-dashboard/my-tappals', icon: FileText, label: 'My Generated Tappals' },
    { path: '/clerk-dashboard/assigned-tappals', icon: ScrollText, label: 'Assigned Tappals' },
    { path: '/clerk-dashboard/pending-approvals', icon: EyeOff, label: 'Pending Approvals' },
    { path: '/clerk-dashboard/search', icon: Search, label: 'Search' },
    { path: '/clerk-dashboard/profile', icon: User, label: 'Profile' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path === '/clerk-dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div>
              <img src="/image.png" alt="Logo" className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Clerk Portal</h1>
              <p className="text-sm text-gray-600">File Tracking System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-medium text-sm">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">Clerk</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}

                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center space-x-2">
            <img src="/image.png" alt="Logo" className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Clerk Portal</p>
              <p className="text-xs text-gray-500">File Tracking System</p>
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClerkLayout;