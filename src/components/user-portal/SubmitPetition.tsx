import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Upload,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Building,
  Calendar,
  Paperclip,
  Plus
} from 'lucide-react';
import { mockDepartments } from '../../data/mockTappals';

const SubmitPetition: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedPetitionId, setGeneratedPetitionId] = useState('');
  
  const [formData, setFormData] = useState({
    // Petition Details
    petitionType: '',
    subject: '',
    description: '',
    
    // Personal Information
    fullName: '',
    mobileNumber: '',
    aadharNumber: '',
    address: '',
    
    // Department Selection
    department: '',
    
    // File Uploads
    attachments: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const petitionTypes = [
    'Issue',
    'Request', 
    'Complaint',
    'Suggestion',
    'Land Revenue',
    'Property Tax',
    'Birth Certificate',
    'Death Certificate',
    'Income Certificate',
    'Caste Certificate',
    'Residence Certificate',
    'Water Connection',
    'Building Permission',
    'Road Construction',
    'Drainage Issues',
    'Electricity Connection',
    'Other'
  ];

  const steps = [
    { number: 1, title: 'Petition Details', description: 'What is your petition about?' },
    { number: 2, title: 'Personal Information', description: 'Your contact details' },
    { number: 3, title: 'Department & Files', description: 'Select department and upload files' },
    { number: 4, title: 'Review & Submit', description: 'Review your petition before submission' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.petitionType) newErrors.petitionType = 'Please select a petition type';
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
        break;
      
      case 2:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
        if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
          newErrors.aadharNumber = 'Please enter a valid 12-digit Aadhar number';
        }
        break;
      
      case 3:
        if (!formData.department) newErrors.department = 'Please select a department';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate petition ID
    const petitionId = `PET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    setGeneratedPetitionId(petitionId);
    
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleReset = () => {
    setFormData({
      petitionType: '',
      subject: '',
      description: '',
      fullName: '',
      mobileNumber: '',
      aadharNumber: '',
      address: '',
      department: '',
      attachments: []
    });
    setCurrentStep(1);
    setErrors({});
    setShowSuccess(false);
    setGeneratedPetitionId('');
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Petition Submitted Successfully!
          </h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-800 font-medium mb-2">Your Petition ID:</p>
            <div className="text-2xl font-bold text-green-600 bg-white px-4 py-2 rounded-lg border border-green-300">
              {generatedPetitionId}
            </div>
          </div>
          
          <div className="text-gray-600 space-y-2 mb-8">
            <p>✅ Your petition has been submitted to the {mockDepartments.find(d => d.id === formData.department)?.name}</p>
            <p>📱 You will receive SMS updates on your mobile number</p>
            <p>⏰ Expected resolution time: 30 days</p>
            <p>🔍 Use your Petition ID to track status anytime</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/user-portal/track')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              Track This Petition
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit Another Petition
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit New Petition</h1>
        <p className="text-gray-600">Fill out the form below to submit your petition to the appropriate department</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="font-medium">{step.number}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-gray-900">{steps[currentStep - 1].title}</h2>
          <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Step 1: Petition Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Petition Type *
              </label>
              <select
                value={formData.petitionType}
                onChange={(e) => setFormData(prev => ({ ...prev, petitionType: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.petitionType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select petition type...</option>
                {petitionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.petitionType && (
                <p className="mt-1 text-sm text-red-600">{errors.petitionType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.subject ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Brief subject of your petition"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Provide detailed description of your petition, including relevant facts and what action you expect..."
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-600">{errors.description}</p>
                ) : (
                  <p className="text-sm text-gray-500">Minimum 20 characters required</p>
                )}
                <p className="text-sm text-gray-500">{formData.description.length} characters</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.mobileNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10-digit mobile number"
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number (Optional)
              </label>
              <input
                type="text"
                value={formData.aadharNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.aadharNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12-digit Aadhar number"
              />
              {errors.aadharNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.aadharNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your complete address including village/city, district, state, and PIN code"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Department & Files */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.department ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select the relevant department...</option>
                {mockDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Your petition will be automatically routed to the selected department
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Supporting Documents (Optional)
              </label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Choose Files
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT (Max 10MB per file)
                  </p>
                </div>
                
                {/* Display attached files */}
                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                    <div className="space-y-1">
                      {formData.attachments.map((fileName, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
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
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Processing Timeline:</p>
                  <p>• Your petition will be processed within 30 days</p>
                  <p>• You will receive SMS/Email updates on progress</p>
                  <p>• For urgent matters, please call our helpline</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Petition</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Petition Type</p>
                  <p className="font-medium">{formData.petitionType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{mockDepartments.find(d => d.id === formData.department)?.name}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-medium">{formData.subject}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{formData.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile Number</p>
                  <p className="font-medium">{formData.mobileNumber}</p>
                </div>
                {formData.aadharNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Aadhar Number</p>
                    <p className="font-medium">{formData.aadharNumber}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm">{formData.address}</p>
                </div>
                {formData.attachments.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Attachments</p>
                    <p className="text-sm">{formData.attachments.length} file(s) attached</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Before submitting:</p>
                  <p>• Please review all information carefully</p>
                  <p>• Ensure your mobile number is correct for SMS updates</p>
                  <p>• Once submitted, you cannot edit the petition</p>
                  <p>• You will receive a Petition ID for tracking</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  currentStep > index + 1 ? 'bg-blue-600' : currentStep === index + 1 ? 'bg-blue-400' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Submit Petition
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitPetition;