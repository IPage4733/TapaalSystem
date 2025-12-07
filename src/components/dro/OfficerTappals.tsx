// OfficerTappals.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Filter, 
  Calendar, 
  Building, 
  User, 
  ExternalLink,
  FileText
} from 'lucide-react';
import {
  formatDate,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  getDaysOverdue
} from '../../utils/dateUtils';

// API endpoints
const OFFICERS_API =
  'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const TAPPALS_API =
  'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';

type Officer = {
  id: string;
  name: string;
  role: string;
  department?: string;
  email?: string;
  phone?: string;
};

type Tappal = {
  id?: string;
  tappalId: string;
  subject?: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  department?: string | null;
  departmentName?: string;
  priority?: string;
  status?: string;
  expiryDate?: string;
  createdAt?: string;
};

const OfficerTappals: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    officer: ''
  });

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------- fetch officers + tappals --------
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [oRes, tRes] = await Promise.all([
          fetch(OFFICERS_API),
          fetch(TAPPALS_API)
        ]);

        if (!oRes.ok) throw new Error(`Officers API error: ${oRes.status}`);
        if (!tRes.ok) throw new Error(`Tappals API error: ${tRes.status}`);

        const oData = await oRes.json();
        const tData = await tRes.json();

        const apiOfficers: Officer[] = (oData?.officers || []).map((o: any) => ({
          id: o.id,
          name: o.name,
          role: o.role,
          department: o.department,
          email: o.email,
          phone: o.phone
        }));

        const apiTappals: Tappal[] = Array.isArray(tData) ? tData : [];

        if (mounted) {
          setOfficers(apiOfficers);
          setTappals(apiTappals);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load officer tappals');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // -------- hierarchy: who is under DRO? --------
  const normalize = (s?: string) => (s || '').toLowerCase().trim();

  const isUnderDRO = (role?: string) => {
    const r = normalize(role);
    const keys = [
      'revenue divisional officer', // RDO
      'rdo',
      'tahsildar',
      'naib tahsildar',
      'naib_tahsildar',
      'revenue inspector',
      'ri',
      'village revenue officer',
      'vro',
      'clerk'
    ];
    return keys.some(k => r.includes(k));
  };

  // Officers below DRO (RDO, Tahsildar, Naib, RI, VRO, Clerk)
  const officersBelow = useMemo(
    () => officers.filter(o => isUnderDRO(o.role)),
    [officers]
  );

  // Tappals assigned to those officers
  const officerTappals = useMemo(() => {
    const ids = new Set(officersBelow.map(o => o.id));
    return tappals.filter(t => t.assignedTo && ids.has(t.assignedTo));
  }, [officersBelow, tappals]);

  // Department options based on tappals under DRO
  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    officerTappals.forEach(t => {
      const id = (t.department || t.departmentName || '').trim();
      const label = (t.departmentName || t.department || id).trim();
      if (id) map.set(id, label || id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [officerTappals]);

  // Officer options based only on tappals (fixes "Pavan shows empty" issue)
  const officerOptions = useMemo(() => {
    const map = new Map<string, string>();
    officerTappals.forEach(t => {
      if (t.assignedTo) {
        const id = t.assignedTo.trim();
        const name = (t.assignedToName || t.assignedTo).trim();
        if (id && !map.has(id)) {
          map.set(id, name);
        }
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [officerTappals]);

  // Filtered tappals
  const filteredTappals = useMemo(() => {
    return officerTappals.filter(tappal => {
      const deptId = (tappal.department || tappal.departmentName || '').trim();
      const matchesDepartment =
        !filters.department || deptId === filters.department;

      const matchesStatus =
        !filters.status ||
        (tappal.status || '').toLowerCase() === filters.status.toLowerCase();

      const matchesOfficer =
        !filters.officer ||
        (tappal.assignedTo || '').trim() === filters.officer.trim();

      return matchesDepartment && matchesStatus && matchesOfficer;
    });
  }, [officerTappals, filters]);

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  const statusOptions = [
    'Pending',
    'In Progress',
    'Under Review',
    'Completed',
    'Rejected',
    'FORWARDED',
    'Active'
  ];

  // Stats
  const stats = useMemo(() => {
    const total = officerTappals.length;
    const pending = officerTappals.filter(
      t => (t.status || '').toLowerCase() === 'pending'
    ).length;
    const inProgress = officerTappals.filter(
      t => (t.status || '').toLowerCase() === 'in progress'
    ).length;
    const completed = officerTappals.filter(
      t => (t.status || '').toLowerCase() === 'completed'
    ).length;
    const overdue = officerTappals.filter(t =>
      isOverdue(t.expiryDate || '', t.status || '')
    ).length;

    return { total, pending, inProgress, completed, overdue };
  }, [officerTappals]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600">Loading officer tappals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  // -------- UI (same as your original) --------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Officer Tappal Overview
        </h1>
        <p className="text-gray-600">
          Monitor tappals assigned to officers under your supervision
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pending}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.inProgress}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={e =>
                setFilters(prev => ({ ...prev, department: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departmentOptions.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e =>
                setFilters(prev => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Officer
            </label>
            <select
              value={filters.officer}
              onChange={e =>
                setFilters(prev => ({ ...prev, officer: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officerOptions.map(officer => (
                <option key={officer.id} value={officer.id}>
                  {officer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Officer Tappals ({filteredTappals.length})
          </h2>
        </div>
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
                  Assigned To
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
                  Expiry
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map(tappal => {
                const overdueStatus = isOverdue(
                  tappal.expiryDate || '',
                  tappal.status || ''
                );
                const daysOverdue = getDaysOverdue(tappal.expiryDate || '');

                return (
                  <tr
                    key={tappal.id || tappal.tappalId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTappalClick(tappal.tappalId)}
                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
                      >
                        <span>{tappal.tappalId}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tappal.subject}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {tappal.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {tappal.assignedToName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {tappal.departmentName ||
                            tappal.department ||
                            '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          tappal.status || ''
                        )}`}
                      >
                        {tappal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          tappal.priority || ''
                        )}`}
                      >
                        {tappal.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-900">
                            {formatDate(tappal.expiryDate || '')}
                          </span>
                          {overdueStatus && (
                            <div className="text-xs text-red-600 font-medium">
                              {daysOverdue} days overdue
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tappals found
            </h3>
            <p className="text-gray-500">
              {officerTappals.length === 0
                ? 'No tappals have been assigned to officers under your supervision.'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerTappals;
