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
import { mockTappals } from '../../data/mockTappals';
import { formatDate, getDaysOverdue, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const OverdueAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    severity: ''
  });

  // Get tappals assigned to VRO
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get overdue tappals
  const overdueTappals = useMemo(() => {
    return myTappals.filter(tappal => {
      const expiry = new Date(tappal.expiryDate);
      const today = new Date();
      return today > expiry && tappal.status !== 'Completed';
    }).map(tappal => ({
      ...tappal,
      daysOverdue: getDaysOverdue(tappal.expiryDate)
    }));
  }, [myTappals]);

  const filteredTappals = useMemo(() => {
    return overdueTappals.filter(tappal => {
      let matchesSeverity = true;
      if (filters.severity === '1-7') {
        matchesSeverity = tappal.daysOverdue >= 1 && tappal.daysOverdue <= 7;
      } else if (filters.severity === '7+') {
        matchesSeverity = tappal.daysOverdue > 7;
      }
      return matchesSeverity;
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [overdueTappals, filters]);

  const overdueStats = useMemo(() => {
    const total = overdueTappals.length;
    const mild = overdueTappals.filter(t => t.daysOverdue >= 1 && t.daysOverdue <= 7).length;
    const severe = overdueTappals.filter(t => t.daysOverdue > 7).length;
    const critical = overdueTappals.filter(t => t.daysOverdue > 30).length;

    return { total, mild, severe, critical };
  }, [overdueTappals]);

  const handleSendExplanation = (tappalId: string) => {
    showToast({
      type: 'info',
      title: 'Send Explanation to RI',
      message: `Opening explanation form for ${tappalId}. This feature will be available soon.`,
      duration: 4000
    });
  };

  const handleForwardUpward = (tappalId: string) => {
    navigate(`/vro-dashboard/forward-tappal?tappal=${tappalId}`);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overdue Alerts</h1>
            <p className="text-gray-600">Monitor and manage your overdue tappals</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
            Overdue Tappals ({filteredTappals.length})
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
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Escalation Note
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
                      className="text-cyan-600 hover:text-cyan-800 font-medium flex items-center space-x-1"
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
                    {tappal.daysOverdue > 7 ? (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        RI & Naib Notified
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Pending escalation
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSendExplanation(tappal.tappalId)}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Explain
                      </button>
                      <button
                        onClick={() => handleForwardUpward(tappal.tappalId)}
                        className="inline-flex items-center px-3 py-1 border border-cyan-300 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Forward
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
                ? "Great! All your tappals are on track." 
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>

      {/* Action Note */}
      {filteredTappals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Immediate Action Required</h3>
              <p className="text-red-700 mb-4">
                You have {filteredTappals.length} overdue tappal{filteredTappals.length > 1 ? 's' : ''} that require immediate attention. 
                Please provide explanations or forward them upward as necessary.
              </p>
              <div className="text-sm text-red-700">
                <p><strong>Note:</strong> Tappals overdue by more than 7 days automatically trigger alerts to RI and Naib Tahsildar. 
                You can send explanations for delays or forward tappals upward if needed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueAlerts;