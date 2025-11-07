// src/components/user/TrackPetitions.tsx
import React, { useState, useMemo, useEffect } from 'react';
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

const API_URL = 'https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition';
const DEPTS_URL = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';

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

  // petitions: start empty (so UI doesn't show fake mock rows). We'll fetch real data.
  const [petitions, setPetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // departments: fetch from API but keep mock as fallback
  const [departments, setDepartments] = useState<any[]>(mockDepartments);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Fetch petitions once on mount
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('API returned non-array response');
        }

        const mapped = data.map((item: any) => {
          // departmentName lookup from fetched/mock departments if possible
          const deptName =
            (departments.find((d: any) => d.id === item.departmentId)?.departmentName ??
              departments.find((d: any) => d.id === item.departmentId)?.name) ||
            item.departmentName ||
            '';

          // tolerant tappal id handling
          const tappalId = item.tappleId ?? item.tappalId ?? item.tappleID ?? item.tappalID ?? '';

          // status mapping: API sample uses "Pending" -> map to "Submitted" so UI actions behave as before
          const statusMap = (s: string) => {
            if (!s) return 'Submitted';
            const lower = s.toLowerCase();
            if (lower === 'pending') return 'Submitted';
            return s;
          };

          return {
            // normalize to the shape UI expects
            id: item.petitionId ?? `${Math.random()}`,
            petitionId: item.petitionId ?? '',
            petitionerName: item.fullName ?? '',
            petitionerPhone: item.mobileNumber ?? '',
            petitionerEmail: item.email ?? '',
            subject: item.subject ?? '',
            description: item.description ?? '',
            // store department as the department ID (from API) so filter compares IDs
            department: item.departmentId ?? item.department ?? '',
            departmentName: deptName,
            status: statusMap(item.status),
            isConfidential: !!item.confidential,
            createdAt: item.createdAt ?? new Date().toISOString(),
            dueDate: item.dueDate ?? null,
            tappalId: tappalId,
            attachments: Array.isArray(item.attachments) ? item.attachments : []
          };
        });

        if (mounted) {
          setPetitions(mapped);
          setFetchError(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch petitions:', err);
        if (mounted) {
          setFetchError(err.message || 'Failed to fetch petitions');
          showToast?.({
            type: 'error',
            title: 'Failed to load petitions',
            message: err.message || 'Check the network or API endpoint'
          });
          // Keep petitions empty (no mock data displayed)
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
    // intentionally no deps so it runs once; department names will update below if departments fetch finishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch departments once and use them in the department dropdown
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchDepts = async () => {
      setDeptLoading(true);
      setDeptError(null);
      try {
        const res = await fetch(DEPTS_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Departments API returned ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid departments response');
        // API returns departmentName — normalize to id/name
        const mapped = data.map((d: any) => ({
          id: d.id,
          departmentName: d.departmentName ?? d.name ?? '',
          departmentCode: d.departmentCode,
          district: d.district,
          state: d.state,
          contactEmail: d.contactEmail,
          headOfDepartment: d.headOfDepartment,
          status: d.status,
          createdAt: d.createdAt
        }));
        if (mounted) {
          setDepartments(mapped);
          setDeptError(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch departments', err);
        if (mounted) {
          setDeptError(err?.message || 'Failed to load departments');
          // fallback to mockDepartments (already initialised)
          setDepartments(mockDepartments);
        }
      } finally {
        if (mounted) setDeptLoading(false);
      }
    };

    fetchDepts();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // When departments arrive/changed, try to fill in any missing departmentName for already-loaded petitions
  useEffect(() => {
    if (!departments || departments.length === 0) return;
    if (!petitions || petitions.length === 0) return;

    const updated = petitions.map(p => {
      if (p.departmentName && p.departmentName.trim().length > 0) return p;
      const dept = departments.find((d: any) => d.id === p.department);
      if (dept) {
        return { ...p, departmentName: dept.departmentName ?? dept.name ?? p.departmentName };
      }
      return p;
    });

    // Only update if something changed (avoid re-renders)
    const changed = JSON.stringify(updated.map(u => u.departmentName)) !== JSON.stringify(petitions.map(p => p.departmentName));
    if (changed) setPetitions(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  const filteredPetitions = useMemo(() => {
    return petitions.filter(petition => {
      // department filter compares IDs — petitions.department contains departmentId from API
      const matchesDepartment = !filters.department || petition.department === filters.department;
      const matchesVisibility = filters.visibility === '' || 
        (filters.visibility === 'confidential' && petition.isConfidential) ||
        (filters.visibility === 'public' && !petition.isConfidential);
      const matchesStatus = !filters.status || petition.status === filters.status;
      const matchesDateRange = (!filters.dateFrom || new Date(petition.createdAt) >= new Date(filters.dateFrom)) &&
                              (!filters.dateTo || new Date(petition.createdAt) <= new Date(filters.dateTo));

      return matchesDepartment && matchesVisibility && matchesStatus && matchesDateRange;
    });
  }, [filters, petitions]);

  const petitionStats = useMemo(() => {
    const total = petitions.length;
    const publicPetitions = petitions.filter(p => !p.isConfidential).length;
    const confidential = petitions.filter(p => p.isConfidential).length;
    const tappalGenerated = petitions.filter(p => p.status === 'Tappal Generated' || !!p.tappalId).length;
    const resolved = petitions.filter(p => p.status === 'Resolved').length;
    const pending = petitions.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length;

    return { total, publicPetitions, confidential, tappalGenerated, resolved, pending };
  }, [petitions]);

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
              <option value="">{deptLoading ? 'Loading departments...' : 'All Departments'}</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName ?? dept.name ?? dept.departmentName}
                </option>
              ))}
            </select>
            {deptError && <p className="text-xs text-red-500 mt-1">Failed to load departments: {deptError}</p>}
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

        {/* Conditional states: loading, fetch error, empty, or table */}
        {isLoading ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading petitions...</h3>
            <p className="text-gray-500">Please wait while we fetch the latest petitions.</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load petitions</h3>
            <p className="text-gray-500">{fetchError}</p>
          </div>
        ) : filteredPetitions.length === 0 ? (
          <div className="text-center py-12">
            <ScrollText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No petitions found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default TrackPetitions;
