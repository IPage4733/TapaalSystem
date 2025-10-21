import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  User,
  Building,
  BarChart3,
  ScrollText
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isOverdue, getStatusColor } from '../../utils/dateUtils';

const JointCollectorDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get officers below Joint Collector (excluding collector and joint_collector)
  const officersBelow = useMemo(() => {
    return mockUsers.filter(u => 
      u.role !== 'collector' && 
      u.role !== 'joint_collector'
    );
  }, []);

  // Get tappals assigned to JC
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get tappals assigned to officers below JC
  const officerTappals = useMemo(() => {
    const officerIds = officersBelow.map(o => o.id);
    return mockTappals.filter(t => officerIds.includes(t.assignedTo));
  }, [officersBelow]);

  // Calculate stats
  const totalTappalsUnderJC = myTappals.length + officerTappals.length;
  const overdueTappalsUnderJC = [...myTappals, ...officerTappals].filter(t => 
    isOverdue(t.expiryDate, t.status)
  ).length;
  const officersSupervised = officersBelow.length;
  const tappalsAssignedToJC = myTappals.length;

  // Get recent tappals (latest 5 from both categories)
  const recentTappals = useMemo(() => {
    const allTappals = [...myTappals, ...officerTappals];
    return allTappals
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [myTappals, officerTappals]);

  const [viewMode, setViewMode] = React.useState<'assigned-to-jc' | 'assigned-to-officers'>('assigned-to-jc');

  const displayTappals = viewMode === 'assigned-to-jc' ? myTappals : officerTappals;

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const quickLinks = [
    {
      title: 'Track Petitions',
      description: 'Monitor citizen petitions',
      icon: ScrollText,
      path: '/joint-collector-dashboard/petitions',
      color: 'emerald'
    },
    {
      title: 'All Tappals',
      description: 'View all system tappals',
      icon: FileText,
      path: '/joint-collector-dashboard/all-tappals',
      color: 'violet'
    },
    {
      title: 'My Assigned Tappals',
      description: 'Tappals assigned to me',
      icon: FileText,
      path: '/joint-collector-dashboard/my-tappals',
      color: 'indigo',
      count: myTappals.length
    },
    {
      title: 'Officer-wise Tracker',
      description: 'Track officer assignments',
      icon: Users,
      path: '/joint-collector-dashboard/officer-tappals',
      color: 'blue',
      count: officerTappals.length
    },
    {
      title: 'Forward Tappals',
      description: 'Forward my tappals',
      icon: FileText,
      path: '/joint-collector-dashboard/forward-tappal',
      color: 'green'
    },
    {
      title: 'Overdue Tappals',
      description: 'Manage overdue items',
      icon: Clock,
      path: '/joint-collector-dashboard/overdue',
      color: 'red',
      count: overdueTappalsUnderJC
    },
    {
      title: 'Performance Analytics',
      description: 'Officer performance',
      icon: BarChart3,
      path: '/joint-collector-dashboard/analytics',
      color: 'purple'
    },
    {
      title: 'Global Search',
      description: 'Search all records',
      icon: FileText,
      path: '/joint-collector-dashboard/search',
      color: 'teal'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Joint Collector Dashboard</h1>
        <p className="text-gray-600">Monitor and manage tappals under your supervision</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals under JC</p>
              <p className="text-2xl font-bold text-gray-900">{totalTappalsUnderJC}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappalsUnderJC}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers Supervised</p>
              <p className="text-2xl font-bold text-blue-600">{officersSupervised}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned to JC</p>
              <p className="text-2xl font-bold text-indigo-600">{tappalsAssignedToJC}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tappals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tappals</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('assigned-to-jc')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'assigned-to-jc'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Assigned to JC
              </button>
              <button
                onClick={() => setViewMode('assigned-to-officers')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'assigned-to-officers'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Assigned to Officers
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {displayTappals.slice(0, 5).map((tappal) => (
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
                        <Building className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{tappal.departmentName}</span>
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
            
            {displayTappals.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {viewMode === 'assigned-to-jc' 
                    ? 'No tappals assigned to you' 
                    : 'No tappals assigned to officers below you'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`p-4 rounded-lg border border-gray-200 hover:border-${link.color}-300 hover:bg-${link.color}-50 transition-colors text-left group flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${link.color}-100 rounded-lg group-hover:bg-${link.color}-200 transition-colors`}>
                      <Icon className={`h-5 w-5 text-${link.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{link.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                    </div>
                  </div>
                  {link.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${link.color}-100 text-${link.color}-700`}>
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JointCollectorDashboardMain;