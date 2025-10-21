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

const OfficerSummary: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    officer: '',
    status: ''
  });

  // Get officers below Naib Tahsildar (RI, VRO, Clerk)
  const officersBelow = useMemo(() => {
    return mockUsers.filter(u => 
      ['ri', 'vro', 'clerk'].includes(u.role)
    );
  }, []);

  // Get tappals assigned to officers below Naib Tahsildar
  const subordinateTappals = useMemo(() => {
    const officerIds = officersBelow.map(o => o.id);
    return mockTappals.filter(t => officerIds.includes(t.assignedTo));
  }, [officersBelow]);

  const filteredTappals = useMemo(() => {
    return subordinateTappals.filter(tappal => {
      const matchesOfficer = !filters.officer || tappal.assignedTo === filters.officer;
      const matchesStatus = !filters.status || tappal.status === filters.status;
      return matchesOfficer && matchesStatus;
    });
  }, [subordinateTappals, filters]);

  const officerPerformance = useMemo(() => {
    const performance: any[] = [];

    officersBelow.forEach(officer => {
      const officerTappals = filteredTappals.filter(t => t.assignedTo === officer.id);
      const completed = officerTappals.filter(t => t.status === 'Completed').length;
      const pending = officerTappals.filter(t => t.status === 'Pending').length;
      const overdue = officerTappals.filter(t => {
        const expiry = new Date(t.expiryDate);
        const today = new Date();
        return today > expiry && t.status !== 'Completed';
      }).length;

      performance.push({
        officer: officer.name,
        role: officer.role,
        department: officer.department,
        total: officerTappals.length,
        completed,
        pending,
        overdue,
        completionRate: officerTappals.length > 0 ? Math.round((completed / officerTappals.length) * 100) : 0
      });
    });

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }, [officersBelow, filteredTappals]);

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

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      ri: 'Revenue Inspector',
      vro: 'Village Revenue Officer',
      clerk: 'Clerk'
    };
    return roleNames[role] || role;
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Officer-wise Summary</h1>
        <p className="text-gray-600">Light analytics and performance insights for subordinate officers</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Officer Name</label>
            <select
              value={filters.officer}
              onChange={(e) => setFilters(prev => ({ ...prev, officer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officersBelow.map(officer => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {getRoleDisplayName(officer.role)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-emerald-600" />
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

      {/* Officer Performance Cards */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Officer Performance Summary</h2>
        </div>
        
        {officerPerformance.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No officers found</h3>
            <p className="text-gray-500">No officers under your supervision or no data available with current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officerPerformance.map((officer, index) => {
              const rating = getPerformanceRating(officer.completionRate);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-medium text-sm">
                          {officer.officer.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{officer.officer}</h3>
                        <p className="text-sm text-gray-600">{getRoleDisplayName(officer.role)}</p>
                        <p className="text-xs text-gray-500">{officer.department}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${rating.color}`}>
                      {rating.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className={`text-lg font-bold ${getPerformanceColor(officer.completionRate)}`}>
                        {officer.completionRate}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Total</p>
                        <p className="font-bold text-gray-900">{officer.total}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-gray-500">Completed</p>
                        <p className="font-bold text-green-600">{officer.completed}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-gray-500">Pending</p>
                        <p className="font-bold text-orange-600">{officer.pending}</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-gray-500">Overdue</p>
                        <p className="font-bold text-red-600">{officer.overdue}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${officer.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Performance Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {overallStats.total > 0 ? Math.round((overallStats.completed / overallStats.total) * 100) : 0}%
            </div>
            <p className="text-gray-600">Overall Completion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {officerPerformance.length}
            </div>
            <p className="text-gray-600">Officers Under Supervision</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {officerPerformance.length > 0 
                ? Math.round(officerPerformance.reduce((sum, officer) => sum + officer.completionRate, 0) / officerPerformance.length)
                : 0}%
            </div>
            <p className="text-gray-600">Average Officer Performance</p>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">Performance Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {officerPerformance.filter(o => o.completionRate >= 90).length}
              </div>
              <p className="text-sm text-green-700">Excellent (90%+)</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {officerPerformance.filter(o => o.completionRate >= 75 && o.completionRate < 90).length}
              </div>
              <p className="text-sm text-blue-700">Good (75-89%)</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {officerPerformance.filter(o => o.completionRate >= 60 && o.completionRate < 75).length}
              </div>
              <p className="text-sm text-yellow-700">Average (60-74%)</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {officerPerformance.filter(o => o.completionRate < 60).length}
              </div>
              <p className="text-sm text-red-700">Needs Improvement (&lt;60%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerSummary;