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
  Send,
  Filter,
  Paperclip
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isOverdue, getStatusColor } from '../../utils/dateUtils';

const RiDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterMode, setFilterMode] = React.useState<'all' | 'my-tappals' | 'vro-tappals'>('all');

  // Get VROs under RI
  const vrosUnderRI = useMemo(() => {
    return mockUsers.filter(u => u.role === 'vro');
  }, []);

  // Get tappals assigned to RI
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get tappals assigned to VROs under RI
  const vroTappals = useMemo(() => {
    const vroIds = vrosUnderRI.map(v => v.id);
    return mockTappals.filter(t => vroIds.includes(t.assignedTo));
  }, [vrosUnderRI]);

  // Calculate stats
  const totalTappalsUnderRI = myTappals.length + vroTappals.length;
  const overdueTappalsUnderRI = [...myTappals, ...vroTappals].filter(t => 
    isOverdue(t.expiryDate, t.status)
  ).length;
  const assignedVROsCount = vrosUnderRI.length;
  const tappalsAssignedToRI = myTappals.length;

  // Get recent tappals based on filter
  const recentTappals = useMemo(() => {
    let tappalsToShow = [];
    
    switch (filterMode) {
      case 'my-tappals':
        tappalsToShow = myTappals;
        break;
      case 'vro-tappals':
        tappalsToShow = vroTappals;
        break;
      default:
        tappalsToShow = [...myTappals, ...vroTappals];
    }
    
    return tappalsToShow
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [myTappals, vroTappals, filterMode]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const quickLinks = [
    {
      title: 'My Assigned Tappals',
      description: 'Tappals assigned to me',
      icon: FileText,
      path: '/ri-dashboard/my-tappals',
      color: 'teal',
      count: myTappals.length
    },
    {
      title: 'VRO Tappal Tracker',
      description: 'Track VRO assignments',
      icon: Users,
      path: '/ri-dashboard/vro-tappals',
      color: 'blue',
      count: vroTappals.length
    },
    {
      title: 'Forward Tappal',
      description: 'Forward my tappals',
      icon: Send,
      path: '/ri-dashboard/forward-tappal',
      color: 'green'
    },
    {
      title: 'Upload Field Notes',
      description: 'Add attachments & remarks',
      icon: Paperclip,
      path: '/ri-dashboard/attachments',
      color: 'purple'
    },
    {
      title: 'Overdue Tappals',
      description: 'Manage overdue items',
      icon: Clock,
      path: '/ri-dashboard/overdue',
      color: 'red',
      count: overdueTappalsUnderRI
    },
    {
      title: 'Light Analytics',
      description: 'Performance insights',
      icon: BarChart3,
      path: '/ri-dashboard/analytics',
      color: 'indigo'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Revenue Inspector Dashboard</h1>
        <p className="text-gray-600">Monitor and manage tappals under your jurisdiction</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Tappals</p>
              <p className="text-2xl font-bold text-teal-600">{tappalsAssignedToRI}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-full">
              <FileText className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tappals with VROs</p>
              <p className="text-2xl font-bold text-blue-600">{vroTappals.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappalsUnderRI}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned VROs</p>
              <p className="text-2xl font-bold text-green-600">{assignedVROsCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <User className="h-6 w-6 text-green-600" />
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
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="my-tappals">My Tappals</option>
                <option value="vro-tappals">VRO Tappals</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentTappals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterMode === 'my-tappals' 
                    ? 'No tappals assigned to you' 
                    : filterMode === 'vro-tappals'
                    ? 'No tappals assigned to VROs'
                    : 'No tappals in your jurisdiction'
                  }
                </p>
              </div>
            ) : (
              recentTappals.map((tappal) => (
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
              ))
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

export default RiDashboardMain;