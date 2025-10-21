import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  User,
  Building,
  Calendar
} from 'lucide-react';
import { mockUsers } from '../../data/mockUsers';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { EmployeePerformance as EmployeePerformanceType } from '../../types/Tappal';

const EmployeePerformance: React.FC = () => {
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    mandal: ''
  });

  const employeePerformance = useMemo(() => {
    const performance: EmployeePerformanceType[] = [];

    mockUsers.forEach(user => {
      const userTappals = mockTappals.filter(t => t.assignedTo === user.id);
      const resolvedTappals = userTappals.filter(t => t.status === 'Completed');
      const overdueTappals = userTappals.filter(t => {
        const expiry = new Date(t.expiryDate);
        const today = new Date();
        return today > expiry && t.status !== 'Completed';
      });

      // Calculate average completion time
      let avgCompletionTime = 0;
      if (resolvedTappals.length > 0) {
        const totalDays = resolvedTappals.reduce((sum, tappal) => {
          if (tappal.completedAt) {
            const created = new Date(tappal.createdAt);
            const completed = new Date(tappal.completedAt);
            const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }
          return sum;
        }, 0);
        avgCompletionTime = Math.round(totalDays / resolvedTappals.length);
      }

      performance.push({
        userId: user.id,
        userName: user.name,
        role: user.role,
        department: user.department,
        assignedTappals: userTappals.length,
        resolvedCount: resolvedTappals.length,
        overdueCount: overdueTappals.length,
        avgCompletionTime,
        lastLogin: '2025-01-17T10:30:00Z' // Mock data
      });
    });

    return performance;
  }, []);

  const filteredPerformance = useMemo(() => {
    return employeePerformance.filter(emp => {
      const matchesRole = !filters.role || emp.role === filters.role;
      const matchesDepartment = !filters.department || emp.department.toLowerCase().includes(filters.department.toLowerCase());
      // Note: Mandal filter would need additional data structure
      return matchesRole && matchesDepartment;
    });
  }, [employeePerformance, filters]);

  const performanceStats = useMemo(() => {
    const totalEmployees = filteredPerformance.length;
    const totalAssigned = filteredPerformance.reduce((sum, emp) => sum + emp.assignedTappals, 0);
    const totalResolved = filteredPerformance.reduce((sum, emp) => sum + emp.resolvedCount, 0);
    const totalOverdue = filteredPerformance.reduce((sum, emp) => sum + emp.overdueCount, 0);
    const avgCompletionTime = filteredPerformance.length > 0 
      ? Math.round(filteredPerformance.reduce((sum, emp) => sum + emp.avgCompletionTime, 0) / filteredPerformance.length)
      : 0;

    return {
      totalEmployees,
      totalAssigned,
      totalResolved,
      totalOverdue,
      avgCompletionTime,
      resolutionRate: totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0
    };
  }, [filteredPerformance]);

  const roleOptions = [...new Set(mockUsers.map(u => u.role))];

  const getPerformanceColor = (resolved: number, assigned: number) => {
    if (assigned === 0) return 'text-gray-500';
    const rate = (resolved / assigned) * 100;
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceRating = (resolved: number, assigned: number, overdue: number) => {
    if (assigned === 0) return 'No Tasks';
    const resolutionRate = (resolved / assigned) * 100;
    const overdueRate = (overdue / assigned) * 100;
    
    if (resolutionRate >= 90 && overdueRate <= 5) return 'Excellent';
    if (resolutionRate >= 75 && overdueRate <= 15) return 'Good';
    if (resolutionRate >= 60 && overdueRate <= 25) return 'Average';
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Employee Performance Analytics</h1>
        <p className="text-gray-600">Track and analyze employee performance metrics</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roleOptions.map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mandal</label>
            <input
              type="text"
              placeholder="Search mandal..."
              value={filters.mandal}
              onChange={(e) => setFilters(prev => ({ ...prev, mandal: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-gray-900">{performanceStats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{performanceStats.totalAssigned}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{performanceStats.totalResolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{performanceStats.totalOverdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-blue-600">{performanceStats.resolutionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-orange-600">{performanceStats.avgCompletionTime}d</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Employee Performance Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPerformance.map((employee) => {
                const rating = getPerformanceRating(employee.resolvedCount, employee.assignedTappals, employee.overdueCount);
                const resolutionRate = employee.assignedTappals > 0 
                  ? Math.round((employee.resolvedCount / employee.assignedTappals) * 100) 
                  : 0;

                return (
                  <tr key={employee.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-xs">
                            {employee.userName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{employee.userName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {employee.role.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.assignedTappals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getPerformanceColor(employee.resolvedCount, employee.assignedTappals)}`}>
                          {employee.resolvedCount}
                        </span>
                        <span className="text-xs text-gray-500">({resolutionRate}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${employee.overdueCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {employee.overdueCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.avgCompletionTime > 0 ? `${employee.avgCompletionTime} days` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(rating)}`}>
                        {rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPerformance.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePerformance;