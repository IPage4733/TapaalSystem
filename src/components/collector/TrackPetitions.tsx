import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { 
  ScrollText, 
  Filter, 
  Calendar, 
  Building, 
  User, 
  Phone,
  Mail,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  UserPlus,
  Save,
  X,
  Search
} from 'lucide-react';
import { mockPetitions, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const TrackPetitions: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    visibility: '', // 'public', 'confidential', or ''
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  const [showTappalModal, setShowTappalModal] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState<any>(null);
  const [tappalForm, setTappalForm] = useState({
    assignedTo: '',
    priority: 'Medium',
    expiryDays: 15,
    isConfidential: false,
    instructions: '',
    attachments: []
  });

  const filteredPetitions = useMemo(() => {
    return mockPetitions.filter(petition => {
      const matchesSearch = 
        petition.petitionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        petition.petitionerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        petition.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        petition.petitionerPhone.includes(searchTerm) ||
        petition.petitionerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesDepartment = !filters.department || petition.department === filters.department;
      const matchesVisibility = filters.visibility === '' || 
        (filters.visibility === 'confidential' && petition.isConfidential) ||
        (filters.visibility === 'public' && !petition.isConfidential);
      const matchesStatus = !filters.status || petition.status === filters.status;
      const matchesDateRange = (!filters.dateFrom || new Date(petition.createdAt) >= new Date(filters.dateFrom)) &&
                              (!filters.dateTo || new Date(petition.createdAt) <= new Date(filters.dateTo));

      return matchesSearch && matchesDepartment && matchesVisibility && matchesStatus && matchesDateRange;
    });
  }, [searchTerm, filters]);

  const petitionStats = useMemo(() => {
    const total = mockPetitions.length;
    const publicPetitions = mockPetitions.filter(p => !p.isConfidential).length;
    const confidential = mockPetitions.filter(p => p.isConfidential).length;
    const tappalGenerated = mockPetitions.filter(p => p.status === 'Tappal Generated').length;
    const resolved = mockPetitions.filter(p => p.status === 'Resolved').length;
    const pending = mockPetitions.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length;

    return { total, publicPetitions, confidential, tappalGenerated, resolved, pending };
  }, []);

  const statusOptions = ['Submitted', 'Under Review', 'Tappal Generated', 'Resolved', 'Rejected'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  
  // Get officers who can be assigned tappals (excluding collector)
  const availableOfficers = mockUsers.filter(user => user.role !== 'collector');

  const handleOpenTappalModal = (petition: any) => {
    setSelectedPetition(petition);
    setTappalForm({
      assignedTo: '',
      priority: 'Medium',
      expiryDays: 15,
      isConfidential: petition.isConfidential,
      instructions: '',
      attachments: []
    });
    setShowTappalModal(true);
  };

  const handleCloseTappalModal = () => {
    setShowTappalModal(false);
    setSelectedPetition(null);
    setTappalForm({
      assignedTo: '',
      priority: 'Medium',
      expiryDays: 15,
      isConfidential: false,
      instructions: '',
      attachments: []
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setTappalForm(prev => ({ 
        ...prev, 
        attachments: [...prev.attachments, ...fileNames] 
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setTappalForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateTappal = () => {
    if (!selectedPetition || !tappalForm.assignedTo) {
      alert('Please select an officer to assign the tappal');
      return;
    }

    const assignedOfficer = availableOfficers.find(officer => officer.id === tappalForm.assignedTo);
    if (!assignedOfficer) {
      alert('Selected officer not found');
      return;
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + tappalForm.expiryDays);

    const newTappalId = `TAP-2025-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    
    const tappalDetails = `
Tappal ${newTappalId} generated and assigned to ${assignedOfficer.name}. Priority: ${tappalForm.priority}, Due: ${expiryDate.toLocaleDateString()}`;
    
    showToast({
      type: 'success',
      title: 'Tappal Generated Successfully!',
      message: tappalDetails,
      duration: 6000
    });
    
    handleCloseTappalModal();
    
    // In real implementation, this would:
    // 1. Create new tappal record
    // 2. Update petition status to 'Tappal Generated'
    // 3. Send notification to assigned officer
  };

  const handleQuickGenerateTappal = (petitionId: string) => {
    const petition = mockPetitions.find(p => p.petitionId === petitionId);
    if (petition) {
      handleOpenTappalModal(petition);
    }
  };

  const handleViewTappal = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Tappal Generated':
        return <ExternalLink className="h-4 w-4 text-blue-600" />;
      case 'Under Review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPetitionStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'text-green-600 bg-green-100';
      case 'Tappal Generated':
        return 'text-blue-600 bg-blue-100';
      case 'Under Review':
        return 'text-yellow-600 bg-yellow-100';
      case 'Submitted':
        return 'text-gray-600 bg-gray-100';
      case 'Rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <ScrollText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Track Petitions</h1>
            <p className="text-gray-600">Monitor citizen petitions and generate tappals for processing</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Petitions</p>
              <p className="text-2xl font-bold text-gray-900">{petitionStats.total}</p>
            </div>
            <ScrollText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Public Petitions</p>
              <p className="text-2xl font-bold text-blue-600">{petitionStats.publicPetitions}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confidential</p>
              <p className="text-2xl font-bold text-red-600">{petitionStats.confidential}</p>
            </div>
            <EyeOff className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tappal Generated</p>
              <p className="text-2xl font-bold text-blue-600">{petitionStats.tappalGenerated}</p>
            </div>
            <ExternalLink className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{petitionStats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{petitionStats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Petitions</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Petition ID, Name, Subject, Phone, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              value={filters.visibility}
              onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Petitions</option>
              <option value="public">Public Only</option>
              <option value="confidential">Confidential Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Petitions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Petitions ({filteredPetitions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Petition ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Petitioner
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
                  Confidential
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPetitions.map((petition) => (
                <React.Fragment key={petition.id}>
                  <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">{petition.petitionId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{petition.petitionerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">{petition.petitionerPhone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">{petition.petitionerEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">{petition.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{petition.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{petition.departmentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(petition.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPetitionStatusColor(petition.status)}`}>
                        {petition.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {petition.isConfidential ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 flex items-center space-x-1">
                          <EyeOff className="h-3 w-3" />
                          <span>Confidential</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100 flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>Public</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(petition.createdAt)}</span>
                    </div>
                  </td>
                  </tr>
                  <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {petition.tappalId ? (
                      <button
                        onClick={() => handleViewTappal(petition.tappalId!)}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                      >
                        <span>{petition.tappalId}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {petition.status === 'Submitted' || petition.status === 'Under Review' ? (
                          <button
                            onClick={() => handleQuickGenerateTappal(petition.petitionId)}
                            className="inline-flex items-center px-3 py-1 border border-green-300 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Generate Tappal
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No Tappal</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td colSpan={6} className="px-6 py-2"></td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPetitions.length === 0 && (
          <div className="text-center py-12">
            <ScrollText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No petitions found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try different search terms or ' : ''}
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>

      {/* Tappal Generation Modal */}
      {showTappalModal && selectedPetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Generate Tappal</h2>
                <button
                  onClick={handleCloseTappalModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Petition Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Petition Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Petition ID:</span>
                    <span className="ml-2 font-medium">{selectedPetition.petitionId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Petitioner:</span>
                    <span className="ml-2 font-medium">{selectedPetition.petitionerName}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Subject:</span>
                    <span className="ml-2 font-medium">{selectedPetition.subject}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{selectedPetition.departmentName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPetition.isConfidential 
                        ? 'text-red-600 bg-red-100' 
                        : 'text-blue-600 bg-blue-100'
                    }`}>
                      {selectedPetition.isConfidential ? 'Confidential' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tappal Assignment Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Tappal Assignment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assign To Officer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to Officer *
                    </label>
                    <select
                      value={tappalForm.assignedTo}
                      onChange={(e) => setTappalForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Officer</option>
                      {availableOfficers.map(officer => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} - {officer.role.replace('_', ' ').toUpperCase()} ({officer.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={tappalForm.priority}
                      onChange={(e) => setTappalForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorityOptions.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>

                  {/* Expiry Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={tappalForm.expiryDays}
                      onChange={(e) => setTappalForm(prev => ({ ...prev, expiryDays: parseInt(e.target.value) || 15 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Expiry Date: {new Date(Date.now() + tappalForm.expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Confidential Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidential Tappal
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tappalForm.isConfidential}
                          onChange={(e) => setTappalForm(prev => ({ ...prev, isConfidential: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Mark as confidential</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={tappalForm.instructions}
                    onChange={(e) => setTappalForm(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter any special instructions for the assigned officer..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={handleCloseTappalModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateTappal}
                disabled={!tappalForm.assignedTo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Generate & Assign Tappal</span>
              </button>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Attachments (Optional)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    />
                  </div>
                  
                  {/* Display attached files */}
                  {tappalForm.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                      <div className="space-y-1">
                        {tappalForm.attachments.map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
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
                  
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPetitions;