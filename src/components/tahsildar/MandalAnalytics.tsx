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
  Users
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const MandalAnalytics: React.FC = () => {
  const [filters, setFilters] = useState({
    officer: '',
    department: '',
    dateRange: {
      from: '',
      to: ''
    }
  });

  // Get officers below Tahsildar (Naib Tahsildar, RI, VRO, Clerk)
  const officersBelow = useMemo(() => {
    return mockUsers.filter(u => 
      ['naib_tahsildar', 'ri', 'vro', 'clerk'].includes(u.role)
    );
  }, []);

  // Get all tappals under Tahsildar's mandal
  const mandalTappals = useMemo(() => {
    const officerIds = officersBelow.map(o => o.id);
    return mockTappals.filter(t => officerIds.includes(t.assignedTo));
  }, [officersBelow]);

  const filteredTappals = useMemo(() => {
    return mandalTappals.filter(tappal => {
      const matchesOfficer = !filters.officer || tappal.assignedTo === filters.officer;
      const matchesDepartment = !filters.department || tappal.department === filters.department;
      const matchesDateRange = (!filters.dateRange.from || new Date(tappal.createdAt) >= new Date(filters.dateRange.from)) &&
                              (!filters.dateRange.to || new Date(tappal.createdAt) <= new Date(filters.dateRange.to));
      return matchesOfficer && matchesDepartment && matchesDateRange;
    });
  }, [mandalTappals, filters]);

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

  const officerPerformance = useMemo(() => {
    const performance: any[] = [];

    officersBelow.forEach(officer => {
      const officerTappals = filteredTappals.filter(t => t.assignedTo === officer.id);
      const completed = officerTappals.filter(t => t.status === 'Completed').length;
      const overdue = officerTappals.filter(t => {
        const expiry = new Date(t.expiryDate);
        const today = new Date();
        return today > expiry && t.status !== 'Completed';
      }).length;

      performance.push({
        officer: officer.name,
        role: officer.role,
        total: officerTappals.length,
        completed,
        overdue,
        completionRate: officerTappals.length > 0 ? Math.round((completed / officerTappals.length) * 100) : 0
      });
    });

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }, [officersBelow, filteredTappals]);

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
        overdue: deptTappals.filter(t => {
          const expiry = new Date(t.expiryDate);
          const today = new Date();
          return today > expiry && t.status !== 'Completed';
        }).length
      };
    });

    return Object.values(stats).filter((dept: any) => dept.total > 0);
  }, [filteredTappals]);

  const maxValue = Math.max(...departmentStats.map((d: any) => d.total), 1);

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      naib_tahsildar: 'Naib Tahsildar',
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mandal Analytics</h1>
        <p className="text-gray-600">Analyze performance and workload across your mandal</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Officer</label>
            <select
              value={filters.officer}
              onChange={(e) => setFilters(prev => ({ ...prev, officer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {mockDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
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
            <FileText className="h-8 w-8 text-green-600" />
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="h-5 w-5 text-green-600" />
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
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(dept.total / maxValue) * 100}%` }}
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

        {/* Officer Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Officer Performance</h2>
          </div>
          <div className="space-y-4">
            {officerPerformance.map((officer, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{officer.officer}</p>
                    <p className="text-sm text-gray-600">{getRoleDisplayName(officer.role)}</p>
                  </div>
                  <span className={`text-lg font-bold ${getPerformanceColor(officer.completionRate)}`}>
                    {officer.completionRate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium">{officer.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completed</p>
                    <p className="font-medium text-green-600">{officer.completed}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Overdue</p>
                    <p className="font-medium text-red-600">{officer.overdue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <PieChart className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
            <span className="text-lg font-bold text-green-600">{overallStats.completed}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">In Progress</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{overallStats.inProgress}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <span className="text-lg font-bold text-orange-600">{overallStats.pending}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Overdue</span>
            </div>
            <span className="text-lg font-bold text-red-600">{overallStats.overdue}</span>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {overallStats.total > 0 ? Math.round((overallStats.completed / overallStats.total) * 100) : 0}%
            </div>
            <p className="text-gray-600">Overall Completion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {officerPerformance.length}
            </div>
            <p className="text-gray-600">Officers Under Command</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {overallStats.total > 0 ? Math.round(((overallStats.pending + overallStats.inProgress) / overallStats.total) * 100) : 0}%
            </div>
            <p className="text-gray-600">Work in Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandalAnalytics;