import React, { useState } from 'react';
import { useToast } from '../common/ToastContainer';
import { 
  UserPlus, 
  Save, 
  X,
  Eye,
  EyeOff,
  Shield,
  CheckCircle
} from 'lucide-react';
import { UserRole } from '../../types/User';

const CreateOfficer: React.FC = () => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'clerk' as UserRole,
    department: '',
    phoneNumber: '',
    employeeId: '',
    joiningDate: ''
  });

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'collector', label: 'District Collector', description: 'Highest administrative authority' },
    { value: 'joint_collector', label: 'Joint Collector', description: 'Assistant to District Collector' },
    { value: 'dro', label: 'District Revenue Officer', description: 'Revenue department head' },
    { value: 'rdo', label: 'Revenue Divisional Officer', description: 'Divisional revenue management' },
    { value: 'tahsildar', label: 'Tahsildar', description: 'Mandal level administration' },
    { value: 'naib_tahsildar', label: 'Naib Tahsildar', description: 'Assistant Tahsildar' },
    { value: 'ri', label: 'Revenue Inspector', description: 'Field level revenue officer' },
    { value: 'vro', label: 'Village Revenue Officer', description: 'Village level administration' },
    { value: 'clerk', label: 'Clerk', description: 'Administrative support' }
  ];

  const departmentOptions = [
    'District Administration',
    'Revenue Department',
    'Development Office',
    'Tehsil Office',
    'Village Office',
    'General Administration',
    'Land Records',
    'Public Works Department',
    'Health Department',
    'Education Department'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || 
        !formData.role || !formData.department || !formData.phoneNumber) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'Password and confirm password do not match.'
      });
      return;
    }

    if (formData.password.length < 6) {
      showToast({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    // Generate employee ID if not provided
    const employeeId = formData.employeeId || `EMP${Date.now().toString().slice(-6)}`;
    
    // In real implementation, this would:
    // 1. Create officer record in database
    // 2. Send welcome email with credentials
    // 3. Create initial permissions
    // 4. Log creation activity

    showToast({
      type: 'success',
      title: 'Officer Created Successfully!',
      message: `${formData.name} has been created as ${roleOptions.find(r => r.value === formData.role)?.label}. Employee ID: ${employeeId}`,
      duration: 8000
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'clerk',
      department: '',
      phoneNumber: '',
      employeeId: '',
      joiningDate: ''
    });
  };

  const handleClear = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'clerk',
      department: '',
      phoneNumber: '',
      employeeId: '',
      joiningDate: ''
    });
  };

  const selectedRole = roleOptions.find(r => r.value === formData.role);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <UserPlus className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Officer</h1>
            <p className="text-gray-600">Add a new officer to the system with appropriate role and permissions</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email address"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>
          </div>

          {/* Role and Department */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role and Department</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedRole && (
                  <p className="text-xs text-gray-500 mt-1">{selectedRole.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select department...</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                />
              </div>
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Officer</span>
            </button>
          </div>
        </div>
      </form>

      {/* Security Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-purple-800 mb-2">Security Guidelines</h3>
            <div className="text-purple-700 space-y-1">
              <p>• <strong>Password Policy:</strong> Minimum 6 characters required</p>
              <p>• <strong>Email Verification:</strong> Welcome email will be sent to the officer</p>
              <p>• <strong>Role Permissions:</strong> Access rights are automatically assigned based on role</p>
              <p>• <strong>Employee ID:</strong> Auto-generated if not provided</p>
              <p>• <strong>Account Activation:</strong> Officer can login immediately after creation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOfficer;