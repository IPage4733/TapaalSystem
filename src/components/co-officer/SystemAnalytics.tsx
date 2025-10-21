import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Calendar, 
  Filter,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, isOverdue } from '../../utils/dateUtils';

const SystemAnalytics: React.FC = () => {
  const [filters, setFilters] = useState({
    department: '',
    dateRange: {
      from: '',
      to: ''
    },
    officer: ''
  });

  const officers = mockUsers.filter(u => u.role !== 'co_officer');

  const filteredTappals = useMemo(() => {
    return mockTappals.filter(tappal => {
      const matchesDepartment = !filters.department || tappal.department === filters.department;
      const matchesOfficer = !filters.officer || tappal.assignedTo === filters.officer;
      const matchesDateRange = (!filters.dateRange.from || new Date(tappal.createdAt) >= new Date(filters.dateRange.from)) &&
                              (!filters.dateRange.to || new Date(tappal.createdAt) <= new Date(filters.dateRange.to));
      return matchesDepartment && matchesOfficer && matchesDateRange;
    });
  }, [filters]);

  const systemStats = useMemo(() => {
    const total = filteredTappals.length;
    const completed = filteredTappals.filter(t => t.status === 'Completed').length;
    const pending = filteredTappals.filter(t => t.status === 'Pending').length;
    const inProgress = filteredTappals.filter(t => t.status === 'In Progress').length;
    const overdue = filteredTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, inProgress, overdue, completionRate };
  }, [filteredTappals]);

  const departmentStats = useMemo(() => {
    const stats: Record<string, any> = {};
    
    mockDepartments.forEach(dept => {
      const deptTappals = filteredTappals.filter(t => t.department === dept.id);
      stats[dept.id] = {
        name: dept.name,
        total: deptTappals.length,
        completed: deptTappals.filter(t => t.status === 'Completed').length,
        pending: deptTappals.filter(t => t.status === 'Pending').length,
        inProgress: deptTappals.filter(t => t.status === 'In Progress').length,
        overdue: deptTappals.filter(t => isOverdue(t.expiryDate, t.status)).length
      };
    });

    return Object.values(stats).filter((dept: any) => dept.total > 0);
  }, [filteredTappals]);

  const officerPerformance = useMemo(() => {
    const performance: any[] = [];

    officers.forEach(officer => {
      const officerTappals = filteredTappals.filter(t => t.assignedTo === officer.id);
      const completed = officerTappals.filter(t => t.status === 'Completed').length;
      const overdue = officerTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;

      if (officerTappals.length > 0) {
        performance.push({
          officer: officer.name,
          role: officer.role,
          department: officer.department,
          total: officerTappals.length,
          completed,
          overdue,
          completionRate: Math.round((completed / officerTappals.length) * 100)
        });
      }
    });

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }, [officers, filteredTappals]);

  const monthlyTrends = useMemo(() => {
    const trends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    months.forEach(month => {
      // Mock data for demonstration
      const monthData = {
        month,
        created: Math.floor(Math.random() * 50) + 20,
        completed: Math.floor(Math.random() * 40) + 15,
        overdue: Math.floor(Math.random() * 10) + 2
      };
      trends.push(monthData);
    });

    return trends;
  }, []);

  const maxDeptValue = Math.max(...departmentStats.map((d: any) => d.total), 1);
  const maxMonthlyValue = Math.max(...monthlyTrends.map(m => Math.max(m.created, m.completed, m.overdue)), 1);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">System Analytics</h1>
        <p className="text-gray-600">Comprehensive analytics and performance insights across the entire system</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {mockDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Officer</label>
            <select
              value={filters.officer}
              onChange={(e) => setFilters(prev => ({ ...prev, officer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateRange.from}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, from: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateRange.to}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, to: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{systemStats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{systemStats.inProgress}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{systemStats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{systemStats.overdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Department Performance</h2>
          </div>
          <div className="space-y-4">
            {departmentStats.map((dept: any, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <span className="text-sm text-gray-500">{dept.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(dept.total / maxDeptValue) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Completed: {dept.completed}</span>
                  <span>Overdue: {dept.overdue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Monthly Trends</h2>
          </div>
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{month.month} 2025</span>
                  <span className="text-sm text-gray-500">
                    Total: {month.created + month.completed + month.overdue}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                  <div
                    className="bg-blue-500 h-4 absolute left-0 top-0"
                    style={{ width: `${(month.created / maxMonthlyValue) * 100}%` }}
                  ></div>
                  <div
                    className="bg-green-500 h-4 absolute top-0"
                    style={{ 
                      left: `${(month.created / maxMonthlyValue) * 100}%`,
                      width: `${(month.completed / maxMonthlyValue) * 100}%` 
                    }}
                  ></div>
                  <div
                    className="bg-red-500 h-4 absolute top-0"
                    style={{ 
                      left: `${((month.created + month.completed) / maxMonthlyValue) * 100}%`,
                      width: `${(month.overdue / maxMonthlyValue) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {month.created}</span>
                  <span>Completed: {month.completed}</span>
                  <span>Overdue: {month.overdue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Officer Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Officers</h2>
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
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officerPerformance.slice(0, 10).map((officer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-xs">
                          {officer.officer.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{officer.officer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {officer.overdue}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {systemStats.completionRate}%
            </div>
            <p className="text-gray-600">Overall System Completion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {officers.length}
            </div>
            <p className="text-gray-600">Active Officers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {mockDepartments.length}
            </div>
            <p className="text-gray-600">Active Departments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;