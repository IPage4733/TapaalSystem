import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { 
  AlertTriangle, 
  Clock, 
  Filter, 
  User, 
  Building, 
  Calendar,
  ExternalLink,
  MessageSquare,
  Send
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getDaysOverdue, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const OverdueTappals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    department: '',
    officer: ''
  });

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

  // Get all overdue tappals in Naib's span
  const overdueTappals = useMemo(() => {
    const allTappals = [...myTappals, ...subordinateTappals];
    return allTappals.filter(tappal => {
      const expiry = new Date(tappal.expiryDate);
      const today = new Date();
      return today > expiry && tappal.status !== 'Completed';
    }).map(tappal => ({
      ...tappal,
      daysOverdue: getDaysOverdue(tappal.expiryDate)
    }));
  }, [myTappals, subordinateTappals]);

  const filteredTappals = useMemo(() => {
    return overdueTappals.filter(tappal => {
      const matchesDepartment = !filters.department || tappal.department === filters.department;
      const matchesOfficer = !filters.officer || tappal.assignedTo === filters.officer;
      return matchesDepartment && matchesOfficer;
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [overdueTappals, filters]);

  const overdueStats = useMemo(() => {
    const total = overdueTappals.length;
    const mild = overdueTappals.filter(t => t.daysOverdue >= 1 && t.daysOverdue <= 7).length;
    const severe = overdueTappals.filter(t => t.daysOverdue > 7).length;
    const myOverdue = overdueTappals.filter(t => t.assignedTo === user?.id).length;
    const subordinateOverdue = overdueTappals.filter(t => t.assignedTo !== user?.id).length;

    return { total, mild, severe, myOverdue, subordinateOverdue };
  }, [overdueTappals, user]);

  const handleForward = (tappalId: string) => {
    navigate(`/naib-dashboard/forward-tappal?tappal=${tappalId}`);
  };

  const handleAddComment = (tappalId: string) => {
    showToast({
      type: 'info',
      title: 'Add Internal Comment',
      message: `Opening comment editor for ${tappalId}. This feature will be available soon.`,
      duration: 4000
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

  // Get all officers in span (including Naib)
  const allOfficersInSpan = useMemo(() => {
    return [
      ...(user ? [user] : []),
      ...officersBelow
    ];
  }, [user, officersBelow]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overdue Tappals</h1>
            <p className="text-gray-600">Monitor and manage overdue tappals under your span</p>
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
              <p className="text-sm font-medium text-gray-600">My Overdue</p>
              <p className="text-2xl font-bold text-emerald-600">{overdueStats.myOverdue}</p>
            </div>
            <User className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subordinate Overdue</p>
              <p className="text-2xl font-bold text-blue-600">{overdueStats.subordinateOverdue}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {allOfficersInSpan.map(officer => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {getRoleDisplayName(officer.role)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overdue Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Overdue Tappals in Span ({filteredTappals.length})
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map((tappal) => {
                const isMyTappal = tappal.assignedTo === user?.id;

                return (
                  <tr key={tappal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTappalClick(tappal.tappalId)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center space-x-1"
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
                          {isMyTappal && (
                            <span className="text-xs text-emerald-600 font-medium">You</span>
                          )}
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
                      <div className="flex items-center space-x-2">
                        {isMyTappal && (
                          <button
                            onClick={() => handleForward(tappal.tappalId)}
                            className="inline-flex items-center px-3 py-1 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Forward
                          </button>
                        )}
                        <button
                          onClick={() => handleAddComment(tappal.tappalId)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Comment
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue tappals found</h3>
            <p className="text-gray-500">
              {overdueStats.total === 0 
                ? "Great! All tappals in your span are on track." 
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>

      {/* Action Note */}
      {filteredTappals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Action Required</h3>
              <p className="text-yellow-700 mb-4">
                {filteredTappals.length} tappals are overdue in your span. You can forward your own tappals 
                to subordinate officers or add internal comments for tracking purposes.
              </p>
              <div className="text-sm text-yellow-700">
                <p><strong>Note:</strong> As Naib Tahsildar, you cannot escalate tappals upward. 
                Focus on forwarding your assigned tappals to appropriate officers or coordinating with subordinates.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueTappals;