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
  UserPlus
} from 'lucide-react';
import { mockPetitions, mockDepartments } from '../../data/mockTappals';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const TrackPetitions: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    department: '',
    visibility: '', // 'public', 'confidential', or ''
    dateFrom: '',
    dateTo: '',
    status: ''
  });

  const filteredPetitions = useMemo(() => {
    return mockPetitions.filter(petition => {
      const matchesDepartment = !filters.department || petition.department === filters.department;
      const matchesVisibility = filters.visibility === '' || 
        (filters.visibility === 'confidential' && petition.isConfidential) ||
        (filters.visibility === 'public' && !petition.isConfidential);
      const matchesStatus = !filters.status || petition.status === filters.status;
      const matchesDateRange = (!filters.dateFrom || new Date(petition.createdAt) >= new Date(filters.dateFrom)) &&
                              (!filters.dateTo || new Date(petition.createdAt) <= new Date(filters.dateTo));

      return matchesDepartment && matchesVisibility && matchesStatus && matchesDateRange;
    });
  }, [filters]);

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

  const handleCreateTappal = (petitionId: string) => {
    navigate(`/co-officer-dashboard/create-tappal?petition=${petitionId}`);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ScrollText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Petitions</h1>
              <p className="text-gray-600">Monitor citizen petitions and create tappals for processing</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/co-officer-dashboard/create-tappal')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tappal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Petitions</p>
              <p className="text-2xl font-bold text-gray-900">{petitionStats.total}</p>
            </div>
            <ScrollText className="h-8 w-8 text-purple-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              value={filters.visibility}
              onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPetitions.map((petition) => (
                <tr key={petition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-purple-600">{petition.petitionId}</span>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {petition.tappalId ? (
                      <button
                        onClick={() => handleViewTappal(petition.tappalId!)}
                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
                      >
                        <span>{petition.tappalId}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {petition.status === 'Submitted' || petition.status === 'Under Review' ? (
                          <button
                            onClick={() => handleCreateTappal(petition.petitionId)}
                            className="inline-flex items-center px-3 py-1 border border-purple-300 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Tappal
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No Tappal</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPetitions.length === 0 && (
          <div className="text-center py-12">
            <ScrollText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No petitions found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPetitions;