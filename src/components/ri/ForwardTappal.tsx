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
  AlertTriangle
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
  const [selectedVroId, setSelectedVroId] = useState('');
  const [reason, setReason] = useState('');

  // Get tappals assigned to current RI
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  // Get VROs under RI
  const vrosUnderRI = useMemo(() => {
    return mockUsers.filter(u => u.role === 'vro');
  }, []);

  const selectedTappal = useMemo(() => {
    return myTappals.find(t => t.tappalId === selectedTappalId);
  }, [myTappals, selectedTappalId]);

  const selectedVro = useMemo(() => {
    return vrosUnderRI.find(v => v.id === selectedVroId);
  }, [vrosUnderRI, selectedVroId]);

  const handleForward = () => {
    if (!selectedTappal || !selectedVro || !reason.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a tappal, VRO, and provide a reason for forwarding.'
      });
      return;
    }

    // In real implementation, this would:
    // 1. Create new movement record
    // 2. Update tappal's assignedTo
    // 3. Send notification to VRO

    showToast({
      type: 'success',
      title: 'Tappal Forwarded Successfully',
      message: `${selectedTappal.tappalId} has been forwarded to ${selectedVro.name} with the specified reason.`,
      duration: 6000
    });

    // Reset form
    setSelectedTappalId('');
    setSelectedVroId('');
    setReason('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forward Tappal</h1>
        <p className="text-gray-600">Forward tappals assigned to you to Village Revenue Officers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available to Forward</p>
              <p className="text-2xl font-bold text-teal-600">{myTappals.length}</p>
            </div>
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">VROs Available</p>
              <p className="text-2xl font-bold text-blue-600">{vrosUnderRI.length}</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Forward Tappal</h2>
        
        <div className="space-y-6">
          {/* Select Tappal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tappal to Forward *
            </label>
            <select
              value={selectedTappalId}
              onChange={(e) => setSelectedTappalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-teal-900 mb-3">Selected Tappal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium text-teal-900">{selectedTappal.tappalId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-teal-600" />
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-teal-900">{selectedTappal.departmentName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <span className="text-gray-600">Expiry:</span>
                  <span className="font-medium text-teal-900">{formatDate(selectedTappal.expiryDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTappal.status)}`}>
                    {selectedTappal.status}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Subject:</span>
                  <span className="ml-2 font-medium text-teal-900">{selectedTappal.subject}</span>
                </div>
              </div>
            </div>
          )}

          {/* Select VRO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forward to VRO *
            </label>
            <select
              value={selectedVroId}
              onChange={(e) => setSelectedVroId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Choose a VRO...</option>
              {vrosUnderRI.map(vro => (
                <option key={vro.id} value={vro.id}>
                  {vro.name} - Village Revenue Officer ({vro.department})
                </option>
              ))}
            </select>
          </div>

          {/* VRO Details */}
          {selectedVro && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Selected VRO Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-blue-900">{selectedVro.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-blue-900">Village Revenue Officer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-blue-900">{selectedVro.department}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-blue-900">{selectedVro.phoneNumber}</span>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter the reason for forwarding this tappal to the selected VRO..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be visible in the movement history and the VRO will be notified.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Once forwarded, the tappal will be assigned to the selected VRO</li>
                  <li>• The VRO will receive a notification about the new assignment</li>
                  <li>• This action will be recorded in the movement history</li>
                  <li>• You will no longer be the assigned officer for this tappal</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedTappalId('');
                setSelectedVroId('');
                setReason('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              onClick={handleForward}
              disabled={!selectedTappal || !selectedVro || !reason.trim()}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Forward Tappal</span>
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
                      <span className="text-sm font-medium text-teal-600">{tappal.tappalId}</span>
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
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
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