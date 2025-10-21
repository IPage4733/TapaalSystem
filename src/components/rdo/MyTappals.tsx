import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { 
  FileText, 
  Calendar, 
  Building, 
  User, 
  Send, 
  Eye,
  Download,
  CheckCircle,
  Filter,
  ExternalLink,
  Paperclip
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { formatDate, getStatusColor, getPriorityColor, isOverdue, getDaysOverdue } from '../../utils/dateUtils';

const MyTappals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    department: ''
  });

  // Get tappals assigned to current RDO
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  const filteredTappals = useMemo(() => {
    return myTappals.filter(tappal => {
      const matchesStatus = !filters.status || tappal.status === filters.status;
      const matchesDepartment = !filters.department || tappal.departmentName.toLowerCase().includes(filters.department.toLowerCase());
      return matchesStatus && matchesDepartment;
    });
  }, [myTappals, filters]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const handleForward = (tappalId: string) => {
    navigate(`/rdo-dashboard/forward-tappal?tappal=${tappalId}`);
  };

  const handleMarkReviewed = (tappalId: string) => {
    showToast({
      type: 'success',
      title: 'Tappal Marked as Reviewed',
      message: `${tappalId} has been marked as reviewed and the status has been updated.`,
      duration: 4000
    });
  };

  const handleViewAttachment = (fileName: string) => {
    showToast({
      type: 'info',
      title: 'Opening Attachment',
      message: `Opening ${fileName} in a new window.`,
      duration: 3000
    });
  };

  const handleAddAttachment = (tappalId: string) => {
    showToast({
      type: 'info',
      title: 'Add Attachment',
      message: `Opening file upload dialog for ${tappalId}. This feature will be available soon.`,
      duration: 4000
    });
  };

  const statusOptions = ['Pending', 'In Progress', 'Under Review', 'Completed', 'Rejected'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Assigned Tappals</h1>
        <p className="text-gray-600">Tappals assigned directly to you as RDO</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-pink-600">{myTappals.length}</p>
            </div>
            <FileText className="h-8 w-8 text-pink-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {myTappals.filter(t => t.status === 'Pending').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {myTappals.filter(t => t.status === 'Completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {myTappals.filter(t => isOverdue(t.expiryDate, t.status)).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-red-600" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            My Tappals ({filteredTappals.length})
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
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attachments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                        className="text-pink-600 hover:text-pink-800 font-medium flex items-center space-x-1"
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
                      {tappal.attachments && tappal.attachments.length > 0 ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{tappal.attachments.length} files</span>
                          <div className="flex space-x-1">
                            {tappal.attachments.slice(0, 2).map((attachment, index) => (
                              <button
                                key={index}
                                onClick={() => handleViewAttachment(attachment)}
                                className="text-pink-600 hover:text-pink-800"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleAddAttachment(tappal.tappalId)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Add attachment"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">No files</span>
                          <button
                            onClick={() => handleAddAttachment(tappal.tappalId)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Add attachment"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleForward(tappal.tappalId)}
                          className="inline-flex items-center px-3 py-1 border border-pink-300 rounded-lg text-xs font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Forward
                        </button>
                        {tappal.status !== 'Completed' && (
                          <button
                            onClick={() => handleMarkReviewed(tappal.tappalId)}
                            className="inline-flex items-center px-3 py-1 border border-green-300 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Reviewed
                          </button>
                        )}
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
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tappals found</h3>
            <p className="text-gray-500">
              {myTappals.length === 0 
                ? "No tappals have been assigned to you yet." 
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTappals;