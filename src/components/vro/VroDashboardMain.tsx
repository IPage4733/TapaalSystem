import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Send,
  AlertTriangle,
  ArrowRight,
  Calendar,
  User,
  Building,
  BarChart3,
  Paperclip,
  Upload
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isOverdue, getStatusColor, getDaysOverdue } from '../../utils/dateUtils';

const VroDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get tappals assigned to VRO
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Calculate stats
  const totalAssigned = myTappals.length;
  const completedTappals = myTappals.filter(t => t.status === 'Completed').length;
  const overdueTappals = myTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;
  const forwardedUpward = Math.floor(Math.random() * 5) + 2; // Mock data for forwarded count

  // Get recent tappals (latest 5)
  const recentTappals = useMemo(() => {
    return myTappals
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [myTappals]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const quickLinks = [
    {
      title: 'My Assigned Tappals',
      description: 'View and manage my tappals',
      icon: FileText,
      path: '/vro-dashboard/my-tappals',
      color: 'cyan',
      count: myTappals.length
    },
    {
      title: 'Forward Tappal Upward',
      description: 'Forward to RI/Naib Tahsildar',
      icon: Send,
      path: '/vro-dashboard/forward-tappal',
      color: 'blue'
    },
    {
      title: 'Upload Attachments',
      description: 'Add field reports & photos',
      icon: Paperclip,
      path: '/vro-dashboard/attachments',
      color: 'green'
    },
    {
      title: 'Overdue Alerts',
      description: 'Manage overdue tappals',
      icon: Clock,
      path: '/vro-dashboard/overdue',
      color: 'red',
      count: overdueTappals
    },
    {
      title: 'My Analytics',
      description: 'Performance insights',
      icon: BarChart3,
      path: '/vro-dashboard/analytics',
      color: 'purple'
    },
    {
      title: 'Search',
      description: 'Find tappals quickly',
      icon: FileText,
      path: '/vro-dashboard/search',
      color: 'indigo'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">VRO Dashboard</h1>
        <p className="text-gray-600">Manage your assigned tappals and field work</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-cyan-600">{totalAssigned}</p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-full">
              <FileText className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTappals}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
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
              <p className="text-sm font-medium text-gray-600">Forwarded Upward</p>
              <p className="text-2xl font-bold text-blue-600">{forwardedUpward}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTappals > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Overdue Tappals Alert</h3>
              <p className="text-red-700 mb-4">
                You have {overdueTappals} overdue tappal{overdueTappals > 1 ? 's' : ''} that require immediate attention. 
                Please review and take necessary action.
              </p>
              <button
                onClick={() => navigate('/vro-dashboard/overdue')}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Clock className="h-4 w-4 mr-2" />
                View Overdue Tappals
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tappals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tappals</h2>
            <button
              onClick={() => navigate('/vro-dashboard/my-tappals')}
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentTappals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tappals assigned to you</p>
              </div>
            ) : (
              recentTappals.map((tappal) => {
                const overdueStatus = isOverdue(tappal.expiryDate, tappal.status);
                const daysOverdue = getDaysOverdue(tappal.expiryDate);

                return (
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
                            <Building className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{tappal.departmentName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{formatDate(tappal.expiryDate)}</span>
                          </div>
                          {overdueStatus && (
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600 font-medium">
                                {daysOverdue} days overdue
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                        {tappal.status}
                      </span>
                    </div>
                  </div>
                );
              })
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

export default VroDashboardMain;