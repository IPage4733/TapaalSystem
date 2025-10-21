import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { mockUsers } from '../../data/mockUsers';
import { mockTappals } from '../../data/mockTappals';
import { isOverdue } from '../../utils/dateUtils';

const PerformanceReports: React.FC = () => {
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    period: 'all'
  });

  const officers = mockUsers.filter(u => u.role !== 'co_officer');

  const performanceData = useMemo(() => {
    const performance: any[] = [];

    officers.forEach(officer => {
      const officerTappals = mockTappals.filter(t => t.assignedTo === officer.id);
      const completed = officerTappals.filter(t => t.status === 'Completed').length;
      const pending = officerTappals.filter(t => t.status === 'Pending').length;
      const inProgress = officerTappals.filter(t => t.status === 'In Progress').length;
      const overdue = officerTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;
      
      // Calculate average completion time (mock calculation)
      const avgCompletionTime = completed > 0 ? Math.round(Math.random() * 10 + 5) : 0;
      
      // Calculate completion rate
      const completionRate = officerTappals.length > 0 ? Math.round((completed / officerTappals.length) * 100) : 0;
      
      // Calculate on-time completion
      const onTimeCompleted = Math.max(0, completed - Math.floor(overdue * 0.3));
      const onTimeRate = completed > 0 ? Math.round((onTimeCompleted / completed) * 100) : 0;

      performance.push({
        officer: officer.name,
        role: officer.role,
        department: officer.department,
        email: officer.email,
        phone: officer.phoneNumber,
        total: officerTappals.length,
        completed,
        pending,
        inProgress,
        overdue,
        completionRate,
        onTimeRate,
        avgCompletionTime,
        rating: getPerformanceRating(completionRate, onTimeRate, overdue)
      });
    });

    // Apply filters
    return performance.filter(p => {
      const matchesRole = !filters.role || p.role === filters.role;
      const matchesDepartment = !filters.department || p.department.toLowerCase().includes(filters.department.toLowerCase());
      return matchesRole && matchesDepartment;
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [officers, filters]);

  const getPerformanceRating = (completionRate: number, onTimeRate: number, overdue: number) => {
    if (completionRate >= 90 && onTimeRate >= 85 && overdue <= 2) return 'Excellent';
    if (completionRate >= 75 && onTimeRate >= 70 && overdue <= 5) return 'Good';
    if (completionRate >= 60 && onTimeRate >= 60 && overdue <= 8) return 'Average';
    return 'Needs Improvement';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Average': return 'text-yellow-600 bg-yellow-100';
      case 'Needs Improvement': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      collector: 'District Collector',
      joint_collector: 'Joint Collector',
      dro: 'District Revenue Officer',
      rdo: 'Revenue Divisional Officer',
      tahsildar: 'Tahsildar',
      naib_tahsildar: 'Naib Tahsildar',
      ri: 'Revenue Inspector',
      vro: 'Village Revenue Officer',
      clerk: 'Clerk'
    };
    return roleNames[role] || role;
  };

  const roleOptions = [...new Set(officers.map(o => o.role))];

  const summaryStats = useMemo(() => {
    const totalOfficers = performanceData.length;
    const excellentPerformers = performanceData.filter(p => p.rating === 'Excellent').length;
    const avgCompletionRate = totalOfficers > 0 
      ? Math.round(performanceData.reduce((sum, p) => sum + p.completionRate, 0) / totalOfficers)
      : 0;
    const totalOverdue = performanceData.reduce((sum, p) => sum + p.overdue, 0);

    return { totalOfficers, excellentPerformers, avgCompletionRate, totalOverdue };
  }, [performanceData]);

  const handleExportReport = () => {
    // Mock export functionality
    const csvContent = [
      ['Officer', 'Role', 'Department', 'Total Tappals', 'Completed', 'Completion Rate', 'On-Time Rate', 'Overdue', 'Rating'].join(','),
      ...performanceData.map(p => [
        p.officer,
        getRoleDisplayName(p.role),
        p.department,
        p.total,
        p.completed,
        `${p.completionRate}%`,
        `${p.onTimeRate}%`,
        p.overdue,
        p.rating
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
              <p className="text-gray-600">Comprehensive officer performance analysis and reports</p>
            </div>
          </div>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Officers</p>
              <p className="text-2xl font-bold text-purple-600">{summaryStats.totalOfficers}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Excellent Performers</p>
              <p className="text-2xl font-bold text-green-600">{summaryStats.excellentPerformers}</p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion Rate</p>
              <p className="text-2xl font-bold text-blue-600">{summaryStats.avgCompletionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Overdue</p>
              <p className="text-2xl font-bold text-red-600">{summaryStats.totalOverdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roleOptions.map(role => (
                <option key={role} value={role}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              placeholder="Search department..."
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Officer Performance Report ({performanceData.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Officer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.map((officer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-xs">
                          {officer.officer.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{officer.officer}</p>
                        <p className="text-xs text-gray-500">{officer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getRoleDisplayName(officer.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {officer.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {officer.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {officer.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        officer.completionRate >= 80 ? 'text-green-600' :
                        officer.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {officer.completionRate}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            officer.completionRate >= 80 ? 'bg-green-500' :
                            officer.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${officer.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {officer.onTimeRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {officer.overdue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {officer.avgCompletionTime} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(officer.rating)}`}>
                      {officer.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {performanceData.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>

      {/* Performance Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {performanceData.filter(p => p.rating === 'Excellent').length}
            </div>
            <p className="text-sm text-green-700">Excellent</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {performanceData.filter(p => p.rating === 'Good').length}
            </div>
            <p className="text-sm text-blue-700">Good</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {performanceData.filter(p => p.rating === 'Average').length}
            </div>
            <p className="text-sm text-yellow-700">Average</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {performanceData.filter(p => p.rating === 'Needs Improvement').length}
            </div>
            <p className="text-sm text-red-700">Needs Improvement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReports;