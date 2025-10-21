import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  EyeOff, 
  Calendar,
  ArrowRight,
  User,
  Building,
  Clock,
  CheckCircle,
  ScrollText
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const ClerkDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get tappals created by current clerk (mock data - in real app would filter by createdBy)
  const myCreatedTappals = useMemo(() => {
    // Mock: assume clerk created some tappals
    return mockTappals.slice(0, 3); // Taking first 3 as example
  }, []);

  // Calculate stats
  const totalCreated = myCreatedTappals.length;
  const confidentialTappals = myCreatedTappals.filter(t => t.isConfidential).length;
  const todaysSubmissions = myCreatedTappals.filter(t => {
    const today = new Date().toDateString();
    const tappalDate = new Date(t.createdAt).toDateString();
    return today === tappalDate;
  }).length;

  // Get recent tappals (latest 5)
  const recentTappals = useMemo(() => {
    return myCreatedTappals
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [myCreatedTappals]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const quickActions = [
    {
      title: 'Track Petitions',
      description: 'View citizen petitions',
      icon: ScrollText,
      path: '/clerk-dashboard/petitions',
      color: 'blue'
    },
    {
      title: 'Create New Tappal',
      description: 'Create a new tappal from petition',
      icon: Plus,
      path: '/clerk-dashboard/create-tappal',
      color: 'orange',
      primary: true
    },
    {
      title: 'My Created Tappals',
      description: 'View all tappals I created',
      icon: FileText,
      path: '/clerk-dashboard/my-tappals',
      color: 'blue',
      count: totalCreated
    },
    {
      title: 'Confidential Tappals',
      description: 'View confidential tappals',
      icon: EyeOff,
      path: '/clerk-dashboard/confidential-tappals',
      color: 'red',
      count: confidentialTappals
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clerk Dashboard</h1>
        <p className="text-gray-600">Create and manage tappals from citizen petitions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals Created</p>
              <p className="text-2xl font-bold text-orange-600">{totalCreated}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confidential Tappals</p>
              <p className="text-2xl font-bold text-red-600">{confidentialTappals}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <EyeOff className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Submissions</p>
              <p className="text-2xl font-bold text-green-600">{todaysSubmissions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left group flex items-center justify-between ${
                    action.primary
                      ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      action.primary 
                        ? 'bg-orange-200 group-hover:bg-orange-300' 
                        : `bg-${action.color}-100 group-hover:bg-${action.color}-200`
                    } transition-colors`}>
                      <Icon className={`h-5 w-5 ${
                        action.primary 
                          ? 'text-orange-700' 
                          : `text-${action.color}-600`
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                  {action.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${action.color}-100 text-${action.color}-700`}>
                      {action.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Tappals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tappals Created</h2>
            <button
              onClick={() => navigate('/clerk-dashboard/my-tappals')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentTappals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tappals created yet</p>
                <button
                  onClick={() => navigate('/clerk-dashboard/create-tappal')}
                  className="mt-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Create your first tappal
                </button>
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
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm">{tappal.tappalId}</p>
                        {tappal.isConfidential && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Confidential
                          </span>
                        )}
                      </div>
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
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Getting Started</h3>
            <div className="text-blue-700 space-y-2">
              <p>• <strong>Create New Tappal:</strong> Convert citizen petitions into trackable tappals</p>
              <p>• <strong>Assign Officers:</strong> Select appropriate department and initial officer</p>
              <p>• <strong>Mark Confidential:</strong> Use for sensitive matters (visible only to Collector)</p>
              <p>• <strong>Track Progress:</strong> Monitor status of all tappals you've created</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboardMain;