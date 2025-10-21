import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, 
  FileText, 
  Search, 
  BarChart3, 
  Users, 
  Clock, 
  Send, 
  User,
  Home,
  AlertTriangle,
  ScrollText
} from 'lucide-react';

const JointCollectorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/joint-collector-dashboard', icon: Home, label: 'Dashboard' },
    { path: '/joint-collector-dashboard/petitions', icon: ScrollText, label: 'Track Petitions' },
    { path: '/joint-collector-dashboard/all-tappals', icon: FileText, label: 'All Tappals' },
    { path: '/joint-collector-dashboard/my-tappals', icon: FileText, label: 'My Assigned Tappals' },
    { path: '/joint-collector-dashboard/officer-tappals', icon: Users, label: 'Officer-wise Tracker' },
    { path: '/joint-collector-dashboard/forward-tappal', icon: Send, label: 'Forward Tappals' },
    { path: '/joint-collector-dashboard/overdue', icon: Clock, label: 'Overdue Tappals' },
    { path: '/joint-collector-dashboard/analytics', icon: BarChart3, label: 'Performance Analytics' },
    { path: '/joint-collector-dashboard/search', icon: Search, label: 'Global Search' }
  ];

  const isActivePath = (path: string) => {
    if (path === '/joint-collector-dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div>
        <img src="/image.png" alt="Logo" className="h-12 w-12" />
      </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Joint Collector</h1>
              <p className="text-sm text-gray-600">File Tracking System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-medium text-sm">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">Joint Collector</p>
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
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default JointCollectorLayout;