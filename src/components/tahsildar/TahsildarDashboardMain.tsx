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
  Filter
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isOverdue, getStatusColor } from '../../utils/dateUtils';

const TahsildarDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterMode, setFilterMode] = React.useState<'all' | 'assigned-to-me' | 'forwarded'>('all');

  // Get officers below Tahsildar (Naib Tahsildar, RI, VRO, Clerk)
  const officersBelow = useMemo(() => {
    return mockUsers.filter(u => 
      ['naib_tahsildar', 'ri', 'vro', 'clerk'].includes(u.role)
    );
  }, []);

  // Get tappals assigned to Tahsildar
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get tappals assigned to officers below Tahsildar
  const officerTappals = useMemo(() => {
    const officerIds = officersBelow.map(o => o.id);
    return mockTappals.filter(t => officerIds.includes(t.assignedTo));
  }, [officersBelow]);

  // Calculate stats
  const totalTappalsInMandal = myTappals.length + officerTappals.length;
  const overdueTappalsInMandal = [...myTappals, ...officerTappals].filter(t => 
    isOverdue(t.expiryDate, t.status)
  ).length;
  const officersUnderCommand = officersBelow.length;
  const tappalsAssignedToTahsildar = myTappals.length;

  // Get recent tappals based on filter
  const recentTappals = useMemo(() => {
    let tappalsToShow = [];
    
    switch (filterMode) {
      case 'assigned-to-me':
        tappalsToShow = myTappals;
        break;
      case 'forwarded':
        tappalsToShow = officerTappals;
        break;
      default:
        tappalsToShow = [...myTappals, ...officerTappals];
    }
    
    return tappalsToShow
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [myTappals, officerTappals, filterMode]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const quickLinks = [
    {
      title: 'My Assigned Tappals',
      description: 'Tappals assigned to me',
      icon: FileText,
      path: '/tahsildar-dashboard/my-tappals',
      color: 'green',
      count: myTappals.length
    },
    {
      title: 'Subordinate Officer Tappals',
      description: 'Track officer assignments',
      icon: Users,
      path: '/tahsildar-dashboard/officer-tappals',
      color: 'blue',
      count: officerTappals.length
    },
    {
      title: 'Forward Tappals',
      description: 'Forward my tappals',
      icon: Send,
      path: '/tahsildar-dashboard/forward-tappal',
      color: 'emerald'
    },
    {
      title: 'Overdue Tappals',
      description: 'Manage overdue items',
      icon: Clock,
      path: '/tahsildar-dashboard/overdue',
      color: 'red',
      count: overdueTappalsInMandal
    },
    {
      title: 'Mandal Analytics',
      description: 'Performance metrics',
      icon: BarChart3,
      path: '/tahsildar-dashboard/analytics',
      color: 'indigo'
    },
    {
      title: 'Global Search',
      description: 'Search all records',
      icon: FileText,
      path: '/tahsildar-dashboard/search',
      color: 'teal'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tahsildar Dashboard</h1>
        <p className="text-gray-600">Monitor and manage tappals under your mandal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals in Mandal</p>
              <p className="text-2xl font-bold text-gray-900">{totalTappalsInMandal}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned to Tahsildar</p>
              <p className="text-2xl font-bold text-green-600">{tappalsAssignedToTahsildar}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappalsInMandal}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers Under Command</p>
              <p className="text-2xl font-bold text-blue-600">{officersUnderCommand}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
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
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="assigned-to-me">Assigned to Me</option>
                <option value="forwarded">Forwarded</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentTappals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterMode === 'assigned-to-me' 
                    ? 'No tappals assigned to you' 
                    : filterMode === 'forwarded'
                    ? 'No tappals forwarded to subordinates'
                    : 'No tappals in mandal'
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

export default TahsildarDashboardMain;
