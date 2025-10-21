import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  FileText, 
  User, 
  Building, 
  Calendar,
  AlertTriangle,
  ArrowUp
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const ForwardTappal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const preSelectedTappal = searchParams.get('tappal');

  const [selectedTappalId, setSelectedTappalId] = useState(preSelectedTappal || '');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [reason, setReason] = useState('');

  // Get tappals assigned to current VRO
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get officers above VRO (RI, Naib Tahsildar)
  const officersAbove = useMemo(() => {
    return mockUsers.filter(u => 
      ['ri', 'naib_tahsildar'].includes(u.role)
    );
  }, []);

  const selectedTappal = useMemo(() => {
    return myTappals.find(t => t.tappalId === selectedTappalId);
  }, [myTappals, selectedTappalId]);

  const selectedOfficer = useMemo(() => {
    return officersAbove.find(o => o.id === selectedOfficerId);
  }, [officersAbove, selectedOfficerId]);

  const handleForward = () => {
    if (!selectedTappal || !selectedOfficer || !reason.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a tappal, officer, and provide a reason for forwarding.'
      });
      return;
    }

    // In real implementation, this would:
    // 1. Create new movement record
    // 2. Update tappal's assignedTo
    // 3. Send notification to new officer

    showToast({
      type: 'success',
      title: 'Tappal Forwarded Successfully',
      message: `${selectedTappal.tappalId} has been forwarded to ${selectedOfficer.name} with the specified reason.`,
      duration: 6000
    });

    // Reset form
    setSelectedTappalId('');
    setSelectedOfficerId('');
    setReason('');
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      ri: 'Revenue Inspector',
      naib_tahsildar: 'Naib Tahsildar'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <ArrowUp className="h-8 w-8 text-cyan-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forward Tappal Upward</h1>
            <p className="text-gray-600">Forward tappals assigned to you to Revenue Inspector or Naib Tahsildar</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available to Forward</p>
              <p className="text-2xl font-bold text-cyan-600">{myTappals.length}</p>
            </div>
            <FileText className="h-8 w-8 text-cyan-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers Available</p>
              <p className="text-2xl font-bold text-blue-600">{officersAbove.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Forwards</p>
              <p className="text-2xl font-bold text-orange-600">
                {myTappals.filter(t => t.status === 'Pending').length}
              </p>
            </div>
            <Send className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Forward Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Forward Tappal Upward</h2>
        
        <div className="space-y-6">
          {/* Select Tappal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tappal to Forward *
            </label>
            <select
              value={selectedTappalId}
              onChange={(e) => setSelectedTappalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Choose a tappal...</option>
              {myTappals.map(tappal => (
                <option key={tappal.id} value={tappal.tappalId}>
                  {tappal.tappalId} - {tappal.subject} ({tappal.status})
                </option>
              ))}
            </select>
          </div>

          {/* Tappal Details */}
          {selectedTappal && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-cyan-900 mb-3">Selected Tappal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium text-cyan-900">{selectedTappal.tappalId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-cyan-600" />
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-cyan-900">{selectedTappal.departmentName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-cyan-600" />
                  <span className="text-gray-600">Expiry:</span>
                  <span className="font-medium text-cyan-900">{formatDate(selectedTappal.expiryDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTappal.status)}`}>
                    {selectedTappal.status}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Subject:</span>
                  <span className="ml-2 font-medium text-cyan-900">{selectedTappal.subject}</span>
                </div>
              </div>
            </div>
          )}

          {/* Select Officer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forward to Officer *
            </label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Choose an officer...</option>
              {officersAbove.map(officer => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {getRoleDisplayName(officer.role)} ({officer.department})
                </option>
              ))}
            </select>
          </div>

          {/* Officer Details */}
          {selectedOfficer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Selected Officer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-blue-900">{selectedOfficer.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-blue-900">{getRoleDisplayName(selectedOfficer.role)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-blue-900">{selectedOfficer.department}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-blue-900">{selectedOfficer.phoneNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Forwarding *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter the reason for forwarding this tappal upward..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be visible in the movement history and the officer will be notified.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Once forwarded, the tappal will be assigned to the selected officer</li>
                  <li>• The officer will receive a notification about the new assignment</li>
                  <li>• This action will be recorded in the movement history</li>
                  <li>• You will no longer be the assigned officer for this tappal</li>
                  <li>• VROs can only forward upward to RI or Naib Tahsildar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedTappalId('');
                setSelectedOfficerId('');
                setReason('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              onClick={handleForward}
              disabled={!selectedTappal || !selectedOfficer || !reason.trim()}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <ArrowUp className="h-4 w-4" />
              <span>Forward Upward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available Tappals */}
      {myTappals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Available Tappals ({myTappals.length})
          </h2>
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
                {myTappals.map((tappal) => (
                  <tr key={tappal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-cyan-600">{tappal.tappalId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{tappal.subject}</p>
                        <p className="text-xs text-gray-500 truncate">{tappal.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{tappal.departmentName}</span>
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
                      <button
                        onClick={() => setSelectedTappalId(tappal.tappalId)}
                        className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                      >
                        Select for Forward
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {myTappals.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tappals Available</h3>
            <p className="text-gray-500">You don't have any tappals assigned to you that can be forwarded.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForwardTappal;