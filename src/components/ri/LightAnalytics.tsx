import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Filter,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { useAuth } from '../../context/AuthContext';

const LightAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    vro: '',
    status: ''
  });

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

  const filteredTappals = useMemo(() => {
    return vroTappals.filter(tappal => {
      const matchesVRO = !filters.vro || tappal.assignedTo === filters.vro;
      const matchesStatus = !filters.status || tappal.status === filters.status;
      return matchesVRO && matchesStatus;
    });
  }, [vroTappals, filters]);

  const vroPerformance = useMemo(() => {
    const performance: any[] = [];

    vrosUnderRI.forEach(vro => {
      const vroTappalsFiltered = filteredTappals.filter(t => t.assignedTo === vro.id);
      const completed = vroTappalsFiltered.filter(t => t.status === 'Completed').length;
      const pending = vroTappalsFiltered.filter(t => t.status === 'Pending').length;
      const overdue = vroTappalsFiltered.filter(t => {
        const expiry = new Date(t.expiryDate);
        const today = new Date();
        return today > expiry && t.status !== 'Completed';
      }).length;

      performance.push({
        vro: vro.name,
        department: vro.department,
        total: vroTappalsFiltered.length,
        completed,
        pending,
        overdue,
        completionRate: vroTappalsFiltered.length > 0 ? Math.round((completed / vroTappalsFiltered.length) * 100) : 0
      });
    });

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }, [vrosUnderRI, filteredTappals]);

  const riStats = useMemo(() => {
    const completed = myTappals.filter(t => t.status === 'Completed').length;
    const forwarded = vroTappals.length;
    const pending = myTappals.filter(t => t.status === 'Pending').length;
    const overdue = myTappals.filter(t => {
      const expiry = new Date(t.expiryDate);
      const today = new Date();
      return today > expiry && t.status !== 'Completed';
    }).length;

    return { completed, forwarded, pending, overdue };
  }, [myTappals, vroTappals]);

  const overallStats = useMemo(() => {
    const total = filteredTappals.length;
    const completed = filteredTappals.filter(t => t.status === 'Completed').length;
    const pending = filteredTappals.filter(t => t.status === 'Pending').length;
    const inProgress = filteredTappals.filter(t => t.status === 'In Progress').length;
    const overdue = filteredTappals.filter(t => {
      const expiry = new Date(t.expiryDate);
      const today = new Date();
      return today > expiry && t.status !== 'Completed';
    }).length;

    return { total, completed, pending, inProgress, overdue };
  }, [filteredTappals]);

  const statusOptions = ['Pending', 'In Progress', 'Under Review', 'Completed', 'Rejected'];

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceRating = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (rate >= 75) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (rate >= 60) return { label: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Light Analytics</h1>
        <p className="text-gray-600">Performance insights for your jurisdiction</p>
      </div>

      {/* RI Performance Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <User className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Performance Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <div className="text-2xl font-bold text-teal-600 mb-1">{riStats.completed}</div>
            <p className="text-sm text-teal-700">Tappals Completed by RI</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">{riStats.forwarded}</div>
            <p className="text-sm text-blue-700">Tappals Forwarded to VROs</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">{riStats.pending}</div>
            <p className="text-sm text-orange-700">Pending with RI</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-1">{riStats.overdue}</div>
            <p className="text-sm text-red-700">Overdue with RI</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">VRO Performance Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VRO Name</label>
            <select
              value={filters.vro}
              onChange={(e) => setFilters(prev => ({ ...prev, vro: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All VROs</option>
              {vrosUnderRI.map(vro => (
                <option key={vro.id} value={vro.id}>
                  {vro.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VRO Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">VRO Performance Summary</h2>
        </div>
        
        {vroPerformance.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No VROs found</h3>
            <p className="text-gray-500">No VROs under your supervision or no data available with current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vroPerformance.map((vro, index) => {
              const rating = getPerformanceRating(vro.completionRate);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-600 font-medium text-sm">
                          {vro.vro.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{vro.vro}</h3>
                        <p className="text-sm text-gray-600">Village Revenue Officer</p>
                        <p className="text-xs text-gray-500">{vro.department}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${rating.color}`}>
                      {rating.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className={`text-lg font-bold ${getPerformanceColor(vro.completionRate)}`}>
                        {vro.completionRate}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Total</p>
                        <p className="font-bold text-gray-900">{vro.total}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-gray-500">Completed</p>
                        <p className="font-bold text-green-600">{vro.completed}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-gray-500">Pending</p>
                        <p className="font-bold text-orange-600">{vro.pending}</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-gray-500">Overdue</p>
                        <p className="font-bold text-red-600">{vro.overdue}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${vro.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total VRO Tappals</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{overallStats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{overallStats.inProgress}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{overallStats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overallStats.overdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Performance Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {overallStats.total > 0 ? Math.round((overallStats.completed / overallStats.total) * 100) : 0}%
            </div>
            <p className="text-gray-600">Overall VRO Completion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {vroPerformance.length}
            </div>
            <p className="text-gray-600">VROs Under Supervision</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {vroPerformance.length > 0 
                ? Math.round(vroPerformance.reduce((sum, vro) => sum + vro.completionRate, 0) / vroPerformance.length)
                : 0}%
            </div>
            <p className="text-gray-600">Average VRO Performance</p>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">VRO Performance Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {vroPerformance.filter(v => v.completionRate >= 90).length}
              </div>
              <p className="text-sm text-green-700">Excellent (90%+)</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {vroPerformance.filter(v => v.completionRate >= 75 && v.completionRate < 90).length}
              </div>
              <p className="text-sm text-blue-700">Good (75-89%)</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {vroPerformance.filter(v => v.completionRate >= 60 && v.completionRate < 75).length}
              </div>
              <p className="text-sm text-yellow-700">Average (60-74%)</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {vroPerformance.filter(v => v.completionRate < 60).length}
              </div>
              <p className="text-sm text-red-700">Needs Improvement (&lt;60%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightAnalytics;