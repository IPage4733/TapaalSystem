import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { 
  Plus, 
  FileText, 
  User, 
  Phone, 
  Building, 
  Calendar,
  EyeOff,
  Save,
  X,
  Upload,
  Paperclip
} from 'lucide-react';
import { mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';

const CreateTappal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    petitionType: '',
    petitionerName: '',
    phoneNumber: '',
    aadharNumber: '',
    department: '',
    subject: '',
    description: '',
    isConfidential: false,
    expiryDate: '',
    assignedTo: '',
    attachments: [] as string[]
  });

  const petitionTypes = [
    'Land Revenue',
    'Property Tax',
    'Birth Certificate',
    'Death Certificate',
    'Income Certificate',
    'Caste Certificate',
    'Residence Certificate',
    'Water Connection',
    'Building Permission',
    'Other'
  ];

  // Get officers who can be assigned (excluding collector)
  const availableOfficers = mockUsers.filter(u => u.role !== 'collector');

  // Filter officers by selected department
  const departmentOfficers = availableOfficers.filter(officer => 
    !formData.department || officer.department.toLowerCase().includes(
      mockDepartments.find(d => d.id === formData.department)?.name.toLowerCase() || ''
    )
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setFormData(prev => ({ 
        ...prev, 
        attachments: [...prev.attachments, ...fileNames] 
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.petitionerName || !formData.phoneNumber || !formData.department || 
        !formData.subject || !formData.description || !formData.expiryDate || !formData.assignedTo) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    // Generate tappal ID (in real app, this would be done by backend)
    const tappalId = `TAP-2025-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    
    const assignedOfficer = availableOfficers.find(o => o.id === formData.assignedTo);
    
    // In real implementation, this would:
    // 1. Create tappal record in database
    // 2. Generate unique tappal ID
    // 3. Send notification to assigned officer
    // 4. Send notification to collector if confidential
    // 5. Create initial movement record

    showToast({
      type: 'success',
      title: 'Tappal Created Successfully!',
      message: `Tappal ${tappalId} has been submitted to ${assignedOfficer?.name} in ${mockDepartments.find(d => d.id === formData.department)?.name}.`,
      duration: 8000
    });

    // Reset form
    setFormData({
      petitionType: '',
      petitionerName: '',
      phoneNumber: '',
      aadharNumber: '',
      department: '',
      subject: '',
      description: '',
      isConfidential: false,
      expiryDate: '',
      assignedTo: '',
      attachments: []
    });
  };

  const handleClear = () => {
    setFormData({
      petitionType: '',
      petitionerName: '',
      phoneNumber: '',
      aadharNumber: '',
      department: '',
      subject: '',
      description: '',
      isConfidential: false,
      expiryDate: '',
      assignedTo: '',
      attachments: []
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <Plus className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Tappal</h1>
            <p className="text-gray-600">Convert citizen petition into a trackable tappal</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          {/* Petition Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Petition Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Petition Type *
                </label>
                <select
                  value={formData.petitionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, petitionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select petition type...</option>
                  {petitionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Petitioner's Name *
                </label>
                <input
                  type="text"
                  value={formData.petitionerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, petitionerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter petitioner's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhar Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="1234 5678 9012"
                />
              </div>
            </div>
          </div>

          {/* Tappal Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tappal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value, assignedTo: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select department...</option>
                  {mockDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Brief subject of the petition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Detailed description of the petition and required action"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Officer *
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select officer...</option>
                    {departmentOfficers.map(officer => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} - {officer.role.replace('_', ' ').toUpperCase()} ({officer.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Confidential Toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isConfidential}
                    onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center space-x-1">
                    <EyeOff className="h-4 w-4" />
                    <span>Mark as Confidential</span>
                  </span>
                </label>
                <span className="text-xs text-gray-500">(Visible only to Collector)</span>
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">File Attachments</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
              </div>
              
              {/* Display attached files */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                  <div className="space-y-1">
                    {formData.attachments.map((fileName, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
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
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Create Tappal</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateTappal;