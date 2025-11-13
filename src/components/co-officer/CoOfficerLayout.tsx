import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, 
  FileText, 
  Users, 
  Building, 
  BarChart3, 
  UserPlus, 
  Settings,
  Home,
  Search,
  Shield,
  Award,
  ScrollText,
  Plus
} from 'lucide-react';

const CoOfficerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/co-officer-dashboard', icon: Home, label: 'Dashboard' },
    { path: '/co-officer-dashboard/petitions', icon: ScrollText, label: 'Track Petitions' },
    { path: '/co-officer-dashboard/create-tappal', icon: Plus, label: 'Create Tappal' },
    { path: '/co-officer-dashboard/officers', icon: Users, label: 'Manage Officers' },
    { path: '/co-officer-dashboard/create-officer', icon: UserPlus, label: 'Create Officer' },
    { path: '/co-officer-dashboard/assignments', icon: FileText, label: 'Manage Assignments' },
    { path: '/co-officer-dashboard/departments', icon: Building, label: 'Manage Departments' },
    { path: '/co-officer-dashboard/role', icon: Building, label: 'Manage Roles' },
    { path: '/co-officer-dashboard/analytics', icon: BarChart3, label: 'System Analytics' },
    { path: '/co-officer-dashboard/performance', icon: Award, label: 'Performance Reports' },
    { path: '/co-officer-dashboard/search', icon: Search, label: 'Global Search' },
    { path: '/co-officer-dashboard/settings', icon: Settings, label: 'System Settings' }
  ];

  const isActivePath = (path: string) => {
    if (path === '/co-officer-dashboard') {
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
              <h1 className="text-lg font-semibold text-gray-900">Co-Officer Portal</h1>
              <p className="text-sm text-gray-600">Administrative Control</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">Chief Officer</p>
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
                    ? 'bg-purple-100 text-purple-700'
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

export default CoOfficerLayout;