import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  EyeOff, 
  Calendar, 
  Building, 
  User, 
  ExternalLink,
  Shield,
  FileText
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const ConfidentialTappals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get confidential tappals created by current clerk
  const confidentialTappals = useMemo(() => {
    // Mock: assume clerk created some confidential tappals
    return mockTappals.filter(t => t.isConfidential).slice(0, 2); // Taking first 2 confidential as example
  }, []);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <EyeOff className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Confidential Tappals</h1>
            <p className="text-gray-600">Sensitive tappals visible only to you and the Collector</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">Security Notice</h3>
            <div className="text-red-700 space-y-1">
              <p>• These tappals are marked as confidential and have restricted access</p>
              <p>• Only you (the creator) and the District Collector can view these tappals</p>
              <p>• Handle with appropriate care and maintain confidentiality</p>
              <p>• Do not discuss details outside authorized personnel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Confidential</p>
              <p className="text-2xl font-bold text-red-600">{confidentialTappals.length}</p>
            </div>
            <EyeOff className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {confidentialTappals.filter(t => t.status === 'Completed').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {confidentialTappals.filter(t => t.status === 'In Progress').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Confidential Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <EyeOff className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Confidential Tappals ({confidentialTappals.length})
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-50 border-b border-red-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                  Tappal ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {confidentialTappals.map((tappal) => (
                <tr key={tappal.id} className="hover:bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTappalClick(tappal.tappalId)}
                      className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
                    >
                      <span>{tappal.tappalId}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <EyeOff className="h-4 w-4 text-red-500" />
                        <p className="text-sm font-medium text-gray-900 truncate">{tappal.subject}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{tappal.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{tappal.assignedToName}</span>
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
                      <span className="text-sm text-gray-900">{formatDate(tappal.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                      {tappal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {confidentialTappals.length === 0 && (
          <div className="text-center py-12">
            <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No confidential tappals found</h3>
            <p className="text-gray-500">You haven't created any confidential tappals yet.</p>
          </div>
        )}
      </div>

      {/* Access Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Access Information</h3>
            <div className="text-blue-700 space-y-1">
              <p><strong>Who can access these tappals:</strong></p>
              <p>• You (the creator) - Full access</p>
              <p>• District Collector - Full access for oversight</p>
              <p>• Assigned officers - Can view and work on the tappal but cannot see it's marked as confidential</p>
              <p><strong>Security:</strong> The confidential marking is only visible to you and the Collector</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialTappals;