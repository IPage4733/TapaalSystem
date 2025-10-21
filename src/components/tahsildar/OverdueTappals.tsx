import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { 
  AlertTriangle, 
  Clock, 
  Filter, 
  User, 
  Building, 
  Calendar,
  ExternalLink,
  ArrowUp,
  UserX
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getDaysOverdue, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const OverdueTappals: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    department: '',
    officer: '',
    severity: ''
  });

  // Get officers below Tahsildar (Naib Tahsildar, RI, VRO, Clerk)
  const officersBelow = useMemo(() => {
    return mockUsers.filter(u => 
      ['naib_tahsildar', 'ri', 'vro', 'clerk'].includes(u.role)
    );
  }, []);

  // Get all tappals under Tahsildar's mandal (including own and subordinates)
  const mandalTappals = useMemo(() => {
    const officerIds = officersBelow.map(o => o.id);
    return mockTappals.filter(t => officerIds.includes(t.assignedTo));
  }, [officersBelow]);

  const overdueTappals = useMemo(() => {
    return mandalTappals.filter(tappal => {
      const expiry = new Date(tappal.expiryDate);
      const today = new Date();
      return today > expiry && tappal.status !== 'Completed';
    }).map(tappal => ({
      ...tappal,
      daysOverdue: getDaysOverdue(tappal.expiryDate)
    }));
  }, [mandalTappals]);

  const filteredTappals = useMemo(() => {
    return overdueTappals.filter(tappal => {
      const matchesDepartment = !filters.department || tappal.department === filters.department;
      const matchesOfficer = !filters.officer || tappal.assignedTo === filters.officer;
      
      let matchesSeverity = true;
      if (filters.severity === '1-7') {
        matchesSeverity = tappal.daysOverdue >= 1 && tappal.daysOverdue <= 7;
      } else if (filters.severity === '7+') {
        matchesSeverity = tappal.daysOverdue > 7;
      }

      return matchesDepartment && matchesOfficer && matchesSeverity;
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [overdueTappals, filters]);

  const overdueStats = useMemo(() => {
    const total = overdueTappals.length;
    const mild = overdueTappals.filter(t => t.daysOverdue >= 1 && t.daysOverdue <= 7).length;
    const severe = overdueTappals.filter(t => t.daysOverdue > 7).length;
    const critical = overdueTappals.filter(t => t.daysOverdue > 30).length;
    const avgDaysOverdue = total > 0 
      ? Math.round(overdueTappals.reduce((sum, t) => sum + t.daysOverdue, 0) / total)
      : 0;

    return { total, mild, severe, critical, avgDaysOverdue };
  }, [overdueTappals]);

  const handleEscalate = (tappalId: string) => {
    showToast({
      type: 'warning',
      title: 'Tappal Escalated',
      message: `${tappalId} has been escalated to higher authority for immediate attention.`,
      duration: 5000
    });
  };

  const handleReassign = (tappalId: string) => {
    showToast({
      type: 'info',
      title: 'Tappal Reassigned',
      message: `${tappalId} is being reassigned to another available officer.`,
      duration: 5000
    });
  };

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const getSeverityColor = (days: number) => {
    if (days > 30) return 'text-red-700 bg-red-100 border-red-200';
    if (days > 7) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getSeverityLabel = (days: number) => {
    if (days > 30) return 'Critical';
    if (days > 7) return 'Severe';
    return 'Mild';
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
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
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overdue Tappals</h1>
            <p className="text-gray-600">Monitor and manage overdue tappals in your mandal</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueStats.total}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">1-7 Days</p>
              <p className="text-2xl font-bold text-orange-600">{overdueStats.mild}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">7+ Days</p>
              <p className="text-2xl font-bold text-red-600">{overdueStats.severe}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical (30+)</p>
              <p className="text-2xl font-bold text-red-700">{overdueStats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Days</p>
              <p className="text-2xl font-bold text-gray-900">{overdueStats.avgDaysOverdue}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-600" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Severities</option>
              <option value="1-7">1-7 Days Overdue</option>
              <option value="7+">7+ Days Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overdue Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Overdue Tappals in Mandal ({filteredTappals.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tappal ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map((tappal) => (
                <tr key={tappal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTappalClick(tappal.tappalId)}
                      className="text-green-600 hover:text-green-800 font-medium flex items-center space-x-1"
                    >
                      <span>{tappal.tappalId}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">{tappal.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{tappal.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tappal.assignedToName}</p>
                        <p className="text-xs text-gray-500">
                          {getRoleDisplayName(mockUsers.find(u => u.id === tappal.assignedTo)?.role || '')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{tappal.departmentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(tappal.daysOverdue)}`}>
                        {tappal.daysOverdue} days
                      </span>
                      <span className={`text-xs font-medium ${getSeverityColor(tappal.daysOverdue).split(' ')[0]}`}>
                        {getSeverityLabel(tappal.daysOverdue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tappal.priority)}`}>
                      {tappal.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                      {tappal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEscalate(tappal.tappalId)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Escalate
                      </button>
                      <button
                        onClick={() => handleReassign(tappal.tappalId)}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Reassign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue tappals found</h3>
            <p className="text-gray-500">
              {overdueStats.total === 0 
                ? "Great! All tappals in your mandal are on track." 
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {filteredTappals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Immediate Action Required</h3>
              <p className="text-red-700 mb-4">
                {filteredTappals.length} tappals are overdue in your mandal and require immediate attention. 
                Consider escalating critical cases or reassigning to available officers.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const criticalTappals = filteredTappals.filter(t => t.daysOverdue > 30);
                    if (criticalTappals.length > 0) {
                      showToast({
                        type: 'warning',
                        title: 'Bulk Escalation',
                        message: `${criticalTappals.length} critical tappals have been escalated to higher authority.`,
                        duration: 6000
                      });
                    } else {
                      showToast({
                        type: 'info',
                        title: 'No Critical Tappals',
                        message: 'No tappals found that require critical escalation.',
                        duration: 4000
                      });
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Escalate Critical Cases
                </button>
                <button
                  onClick={() => showToast({
                    type: 'info',
                    title: 'Bulk Reassignment',
                    message: 'Opening bulk reassignment interface. Feature will be available soon.',
                    duration: 5000
                  })}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Bulk Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueTappals;