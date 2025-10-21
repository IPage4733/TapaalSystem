import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { 
  FileText, 
  Clock, 
  Users, 
  Building, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  User
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, isOverdue, getStatusColor } from '../../utils/dateUtils';

const CollectorDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Calculate stats
  const totalTappals = mockTappals.length;
  const overdueTappals = mockTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;
  const totalEmployees = mockUsers.length;
  const totalDepartments = mockDepartments.length;
  const completedTappals = mockTappals.filter(t => t.status === 'Completed').length;
  const pendingTappals = mockTappals.filter(t => t.status === 'Pending').length;

  // Get recent tappals (latest 5)
  const recentTappals = [...mockTappals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const quickLinks = [
    {
      title: 'Track Petitions',
      description: 'Monitor citizen petitions',
      icon: FileText,
      path: '/collector-dashboard/petitions',
      color: 'blue'
    },
    {
      title: 'All Tappals',
      description: 'View generated tappals',
      icon: FileText,
      path: '/collector-dashboard/tappals',
      color: 'purple'
    },
    {
      title: 'Global Search',
      description: 'Search across all records',
      icon: FileText,
      path: '/collector-dashboard/search',
      color: 'indigo'
    },
    {
      title: 'Department Analytics',
      description: 'Department-wise performance',
      icon: TrendingUp,
      path: '/collector-dashboard/department-analytics',
      color: 'green'
    },
    {
      title: 'Employee Performance',
      description: 'Track employee metrics',
      icon: Users,
      path: '/collector-dashboard/employee-performance',
      color: 'orange'
    },
    {
      title: 'Overdue Tappals',
      description: 'Manage overdue items',
      icon: Clock,
      path: '/collector-dashboard/overdue',
      color: 'red'
    },
    {
      title: 'Manage Departments',
      description: 'Department administration',
      icon: Building,
      path: '/collector-dashboard/departments',
      color: 'teal'
    },
    {
      title: 'User Management',
      description: 'Manage system users',
      icon: Users,
      path: '/collector-dashboard/users',
      color: 'pink'
    }
  ];

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Collector Dashboard</h1>
            <p className="text-gray-600">Welcome to the District Collectorate File Tracking System</p>
          </div>
          <button
            onClick={() => navigate('/collector-dashboard/create-tappal')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <FileText className="h-5 w-5 mr-2" />
            Create New Tappal
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-gray-900">{totalTappals}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappals}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{totalDepartments}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/collector-dashboard/tappals?status=Completed')}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTappals}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view all completed</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/collector-dashboard/tappals?status=Pending')}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingTappals}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view all pending</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/collector-dashboard/overdue')}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappals}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view all overdue</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tappals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tappals</h2>
            <button
              onClick={() => navigate('/collector-dashboard/tappals')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentTappals.map((tappal) => (
              <div
                key={tappal.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleTappalClick(tappal.tappalId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{tappal.tappalId}</p>
                    <p className="text-gray-600 text-sm truncate">{tappal.subject}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{tappal.assignedToName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatDate(tappal.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                    {tappal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`p-4 rounded-lg border border-gray-200 hover:border-${link.color}-300 hover:bg-${link.color}-50 transition-colors text-left group`}
                >
                  <div className={`p-2 bg-${link.color}-100 rounded-lg w-fit mb-2 group-hover:bg-${link.color}-200 transition-colors`}>
                    <Icon className={`h-5 w-5 text-${link.color}-600`} />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboardMain;