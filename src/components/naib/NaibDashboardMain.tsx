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

const NaibDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterMode, setFilterMode] = React.useState<'all' | 'my-tappals' | 'subordinate-tappals'>('all');

  // Get officers below Naib Tahsildar (RI, VRO, Clerk)
  const officersBelow = useMemo(() => {
    return mockUsers.filter(u => 
      ['ri', 'vro', 'clerk'].includes(u.role)
    );
  }, []);

  // Get tappals assigned to Naib Tahsildar
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get tappals assigned to officers below Naib Tahsildar
  const subordinateTappals = useMemo(() => {
    const officerIds = officersBelow.map(o => o.id);
    return mockTappals.filter(t => officerIds.includes(t.assignedTo));
  }, [officersBelow]);

  // Calculate stats
  const totalTappalsInSpan = myTappals.length + subordinateTappals.length;
  const overdueTappalsInSpan = [...myTappals, ...subordinateTappals].filter(t => 
    isOverdue(t.expiryDate, t.status)
  ).length;
  const officersUnderCommand = officersBelow.length;
  const tappalsAssignedToNaib = myTappals.length;

  // Get recent tappals based on filter
  const recentTappals = useMemo(() => {
    let tappalsToShow = [];
    
    switch (filterMode) {
      case 'my-tappals':
        tappalsToShow = myTappals;
        break;
      case 'subordinate-tappals':
        tappalsToShow = subordinateTappals;
        break;
      default:
        tappalsToShow = [...myTappals, ...subordinateTappals];
    }
    
    return tappalsToShow
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [myTappals, subordinateTappals, filterMode]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const quickLinks = [
    {
      title: 'My Assigned Tappals',
      description: 'Tappals assigned to me',
      icon: FileText,
      path: '/naib-dashboard/my-tappals',
      color: 'emerald',
      count: myTappals.length
    },
    {
      title: 'Subordinate Tappals',
      description: 'Track RI/VRO assignments',
      icon: Users,
      path: '/naib-dashboard/subordinate-tappals',
      color: 'blue',
      count: subordinateTappals.length
    },
    {
      title: 'Forward Tappals',
      description: 'Forward my tappals',
      icon: Send,
      path: '/naib-dashboard/forward-tappal',
      color: 'green'
    },
    {
      title: 'Overdue Tappals',
      description: 'Manage overdue items',
      icon: Clock,
      path: '/naib-dashboard/overdue',
      color: 'red',
      count: overdueTappalsInSpan
    },
    {
      title: 'Officer Summary',
      description: 'Performance insights',
      icon: BarChart3,
      path: '/naib-dashboard/analytics',
      color: 'indigo'
    },
    {
      title: 'Search',
      description: 'Search all records',
      icon: FileText,
      path: '/naib-dashboard/search',
      color: 'teal'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Naib Tahsildar Dashboard</h1>
        <p className="text-gray-600">Monitor and manage tappals under your span</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals in Span</p>
              <p className="text-2xl font-bold text-gray-900">{totalTappalsInSpan}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Tappals</p>
              <p className="text-2xl font-bold text-emerald-600">{tappalsAssignedToNaib}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappalsInSpan}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers Below Me</p>
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
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="my-tappals">My Tappals</option>
                <option value="subordinate-tappals">Subordinate Tappals</option>
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
                    : filterMode === 'subordinate-tappals'
                    ? 'No tappals assigned to subordinates'
                    : 'No tappals in your span'
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

export default NaibDashboardMain;