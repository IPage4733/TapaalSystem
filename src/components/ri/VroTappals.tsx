import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Filter, 
  Calendar, 
  Building, 
  User, 
  ExternalLink,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getStatusColor, getPriorityColor, isOverdue, getDaysOverdue } from '../../utils/dateUtils';

const VroTappals: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    vro: '',
    status: '',
    expiry: ''
  });

  // Get VROs under RI
  const vrosUnderRI = useMemo(() => {
    return mockUsers.filter(u => u.role === 'vro');
  }, []);

  // Get tappals assigned to VROs under RI
  const vroTappals = useMemo(() => {
    const vroIds = vrosUnderRI.map(v => v.id);
    return mockTappals.filter(t => vroIds.includes(t.assignedTo));
  }, [vrosUnderRI]);

  const filteredTappals = useMemo(() => {
    return vroTappals.filter(tappal => {
      const matchesVRO = !filters.vro || tappal.assignedTo === filters.vro;
      const matchesStatus = !filters.status || tappal.status === filters.status;
      
      let matchesExpiry = true;
      if (filters.expiry === 'overdue') {
        matchesExpiry = isOverdue(tappal.expiryDate, tappal.status);
      } else if (filters.expiry === 'due-soon') {
        const daysToExpiry = Math.ceil((new Date(tappal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        matchesExpiry = daysToExpiry <= 3 && daysToExpiry >= 0;
      }

      return matchesVRO && matchesStatus && matchesExpiry;
    });
  }, [vroTappals, filters]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const statusOptions = ['Pending', 'In Progress', 'Under Review', 'Completed', 'Rejected'];
  const expiryOptions = [
    { value: '', label: 'All' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'due-soon', label: 'Due Soon (3 days)' }
  ];

  // Calculate stats
  const stats = useMemo(() => {
    const total = vroTappals.length;
    const pending = vroTappals.filter(t => t.status === 'Pending').length;
    const inProgress = vroTappals.filter(t => t.status === 'In Progress').length;
    const completed = vroTappals.filter(t => t.status === 'Completed').length;
    const overdue = vroTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;

    return { total, pending, inProgress, completed, overdue };
  }, [vroTappals]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">VRO Tappal Tracker</h1>
        <p className="text-gray-600">Monitor tappals assigned to Village Revenue Officers under your supervision</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">VRO</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Status</label>
            <select
              value={filters.expiry}
              onChange={(e) => setFilters(prev => ({ ...prev, expiry: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {expiryOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            VRO Tappals ({filteredTappals.length})
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
                  Assigned VRO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map((tappal) => {
                const overdueStatus = isOverdue(tappal.expiryDate, tappal.status);
                const daysOverdue = getDaysOverdue(tappal.expiryDate);

                return (
                  <tr key={tappal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTappalClick(tappal.tappalId)}
                        className="text-teal-600 hover:text-teal-800 font-medium flex items-center space-x-1"
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
                        <span className="text-sm font-medium text-gray-900">{tappal.assignedToName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{tappal.departmentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                        {tappal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tappal.priority)}`}>
                        {tappal.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-900">{formatDate(tappal.expiryDate)}</span>
                          {overdueStatus && (
                            <div className="text-xs text-red-600 font-medium">
                              {daysOverdue} days overdue
                            </div>
                          )}
                        </div>
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
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tappals found</h3>
            <p className="text-gray-500">
              {vroTappals.length === 0 
                ? "No tappals have been assigned to VROs under your supervision." 
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VroTappals;