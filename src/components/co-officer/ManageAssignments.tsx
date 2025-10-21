import React, { useState, useMemo } from 'react';
import { useToast } from '../common/ToastContainer';
import { 
  FileText, 
  Users, 
  Building, 
  Calendar,
  User,
  Send,
  Filter,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const ManageAssignments: React.FC = () => {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    assignedTo: ''
  });
  const [selectedTappals, setSelectedTappals] = useState<string[]>([]);
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const officers = mockUsers.filter(u => u.role !== 'co_officer');

  const filteredTappals = useMemo(() => {
    return mockTappals.filter(tappal => {
      const matchesDepartment = !filters.department || tappal.department === filters.department;
      const matchesStatus = !filters.status || tappal.status === filters.status;
      const matchesAssignedTo = !filters.assignedTo || tappal.assignedTo === filters.assignedTo;
      return matchesDepartment && matchesStatus && matchesAssignedTo;
    });
  }, [filters]);

  const assignmentStats = useMemo(() => {
    const total = mockTappals.length;
    const unassigned = mockTappals.filter(t => !t.assignedTo).length;
    const pending = mockTappals.filter(t => t.status === 'Pending').length;
    const completed = mockTappals.filter(t => t.status === 'Completed').length;

    return { total, unassigned, pending, completed };
  }, []);

  const handleSingleAssign = (tappalId: string, officerId: string) => {
    const officer = officers.find(o => o.id === officerId);
    const tappal = mockTappals.find(t => t.id === tappalId);
    
    if (officer && tappal) {
      showToast({
        type: 'success',
        title: 'Tappal Reassigned',
        message: `${tappal.tappalId} has been assigned to ${officer.name}`,
        duration: 5000
      });
    }
  };

  const handleBulkAssign = () => {
    if (selectedTappals.length === 0 || !bulkAssignTo) {
      showToast({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select tappals and an officer for bulk assignment.'
      });
      return;
    }

    const officer = officers.find(o => o.id === bulkAssignTo);
    if (officer) {
      showToast({
        type: 'success',
        title: 'Bulk Assignment Complete',
        message: `${selectedTappals.length} tappals have been assigned to ${officer.name}`,
        duration: 6000
      });
      
      setSelectedTappals([]);
      setBulkAssignTo('');
      setShowBulkAssign(false);
    }
  };

  const handleSelectTappal = (tappalId: string) => {
    setSelectedTappals(prev => 
      prev.includes(tappalId) 
        ? prev.filter(id => id !== tappalId)
        : [...prev, tappalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTappals.length === filteredTappals.length) {
      setSelectedTappals([]);
    } else {
      setSelectedTappals(filteredTappals.map(t => t.id));
    }
  };

  const statusOptions = ['Pending', 'In Progress', 'Under Review', 'Completed', 'Rejected'];

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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Assignments</h1>
              <p className="text-gray-600">Assign and reassign tappals to appropriate officers</p>
            </div>
          </div>
          <button
            onClick={() => setShowBulkAssign(!showBulkAssign)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send className="h-4 w-4 mr-2" />
            Bulk Assign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-purple-600">{assignmentStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{assignmentStats.pending}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{assignmentStats.completed}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers</p>
              <p className="text-2xl font-bold text-blue-600">{officers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Bulk Assignment Panel */}
      {showBulkAssign && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">Bulk Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Selected Tappals
              </label>
              <div className="text-2xl font-bold text-purple-600">{selectedTappals.length}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Assign to Officer
              </label>
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select officer...</option>
                {officers.map(officer => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} - {getRoleDisplayName(officer.role)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBulkAssign}
                disabled={selectedTappals.length === 0 || !bulkAssignTo}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign Selected
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {mockDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Tappal Assignments ({filteredTappals.length})
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {selectedTappals.length === filteredTappals.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTappals.length === filteredTappals.length && filteredTappals.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
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
                  Currently Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {filteredTappals.map((tappal) => (
                <tr key={tappal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTappals.includes(tappal.id)}
                      onChange={() => handleSelectTappal(tappal.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => window.open(`/tappal/${tappal.tappalId}`, '_blank')}
                      className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
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
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{tappal.assignedToName}</span>
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
                    <select
                      onChange={(e) => e.target.value && handleSingleAssign(tappal.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      defaultValue=""
                    >
                      <option value="">Reassign to...</option>
                      {officers.filter(o => o.id !== tappal.assignedTo).map(officer => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} - {getRoleDisplayName(officer.role)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tappals found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAssignments;