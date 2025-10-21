import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { useSearchParams } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  User, 
  Building, 
  Calendar,
  Paperclip,
  X,
  Save,
  MessageSquare,
  Camera,
  FileImage
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const UploadAttachments: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const preSelectedTappal = searchParams.get('tappal');

  const [selectedTappalId, setSelectedTappalId] = useState(preSelectedTappal || '');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadType, setUploadType] = useState<'report' | 'photo' | 'document'>('report');

  // Get tappals assigned to current VRO
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  const selectedTappal = useMemo(() => {
    return myTappals.find(t => t.tappalId === selectedTappalId);
  }, [myTappals, selectedTappalId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setAttachments(prev => [...prev, ...fileNames]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedTappal) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a tappal to upload attachments.'
      });
      return;
    }

    if (!description.trim() && attachments.length === 0) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please add either a description or attachments before submitting.'
      });
      return;
    }

    // In real implementation, this would:
    // 1. Upload files to storage
    // 2. Add description to tappal comments
    // 3. Update tappal's attachments array
    // 4. Create audit log

    showToast({
      type: 'success',
      title: 'Field Report Uploaded Successfully',
      message: `Your field report and attachments have been added to ${selectedTappal.tappalId}.`,
      duration: 6000
    });

    // Reset form
    setSelectedTappalId('');
    setDescription('');
    setAttachments([]);
  };

  const uploadTypeOptions = [
    { value: 'report', label: 'Field Report', icon: FileText, description: 'Site visit reports and findings' },
    { value: 'photo', label: 'Site Photos', icon: Camera, description: 'Photos from field visits' },
    { value: 'document', label: 'Documents', icon: Paperclip, description: 'Supporting documents and proofs' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Field Reports & Attachments</h1>
        <p className="text-gray-600">Add field reports, site photos, and supporting documents to your assigned tappals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Tappals</p>
              <p className="text-2xl font-bold text-cyan-600">{myTappals.length}</p>
            </div>
            <FileText className="h-8 w-8 text-cyan-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-bold text-orange-600">
                {myTappals.filter(t => t.status === 'In Progress').length}
              </p>
            </div>
            <Upload className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Field Work</p>
              <p className="text-2xl font-bold text-blue-600">
                {myTappals.filter(t => t.status !== 'Completed').length}
              </p>
            </div>
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload Field Report</h2>
        
        <div className="space-y-6">
          {/* Select Tappal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tappal *
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

          {/* Upload Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uploadTypeOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setUploadType(option.value as any)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      uploadType === option.value
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon className={`h-5 w-5 ${uploadType === option.value ? 'text-cyan-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${uploadType === option.value ? 'text-cyan-900' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description/Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Report Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter your field observations, findings, and remarks about this tappal..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Your report will be timestamped and logged against the tappal.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Files
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                  accept={uploadType === 'photo' ? '.jpg,.jpeg,.png' : '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt'}
                />
              </div>
              
              {/* Display attached files */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                  <div className="space-y-1">
                    {attachments.map((fileName, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          {uploadType === 'photo' ? (
                            <FileImage className="h-4 w-4 text-gray-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700">{fileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                {uploadType === 'photo' 
                  ? 'Supported formats: JPG, JPEG, PNG'
                  : 'Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT'
                }
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedTappalId('');
                setDescription('');
                setAttachments([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTappal || (!description.trim() && attachments.length === 0)}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Upload Field Report</span>
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
                    Existing Attachments
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
                      <span className="text-sm text-gray-600">
                        {tappal.attachments ? tappal.attachments.length : 0} files
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTappalId(tappal.tappalId)}
                        className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                      >
                        Select for Upload
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
            <p className="text-gray-500">You don't have any tappals assigned to you for uploading attachments.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadAttachments;