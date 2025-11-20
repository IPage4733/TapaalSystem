// OfficerTappals.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
import { formatDate, getStatusColor, getPriorityColor, isOverdue, getDaysOverdue } from '../../utils/dateUtils';

// Endpoints (use the ones you provided)
const OFFICERS_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const TAPPALS_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';

// Uploaded hierarchy image path (kept as reference; not used in UI by default)
const HIERARCHY_IMG = '/mnt/data/1e718cde-bce6-43b4-ad08-3e0cf86df21d.png';

type Officer = {
  id: string;
  name: string;
  role: string;
  department?: string;
  email?: string;
  phone?: string;
};

type Tappal = {
  id: string;
  tappalId: string;
  subject: string;
  description?: string;
  assignedTo: string; // officer id
  assignedToName?: string;
  department?: string | null;
  departmentName?: string;
  priority?: string;
  status?: string;
  expiryDate?: string; // yyyy-mm-dd
  createdAt?: string;
};

const OfficerTappals: React.FC = () => {
  const navigate = useNavigate();

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    department: '',
    status: '',
    officer: ''
  });

  // fetch both APIs
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [offRes, tapRes] = await Promise.all([
          fetch(OFFICERS_API),
          fetch(TAPPALS_API)
        ]);

        if (!offRes.ok) throw new Error(`Officers API error: ${offRes.status}`);
        if (!tapRes.ok) throw new Error(`Tappals API error: ${tapRes.status}`);

        const offJson = await offRes.json();
        const tappalsJson = await tapRes.json();

        const officersData: Officer[] = (offJson?.officers || []).map((o: any) => ({
          id: o.id,
          name: o.name,
          role: o.role,
          department: o.department,
          email: o.email,
          phone: o.phone
        }));

        const tappalsData: Tappal[] = (Array.isArray(tappalsJson) ? tappalsJson : []).map((t: any) => ({
          id: t.id || t.tappalId || '',
          tappalId: t.tappalId,
          subject: t.subject,
          description: t.description,
          assignedTo: t.assignedTo,
          assignedToName: t.assignedToName,
          department: t.department || t.departmentName || '',
          departmentName: t.departmentName || t.department || '',
          priority: t.priority || 'Low',
          status: t.status || 'Pending',
          expiryDate: t.expiryDate,
          createdAt: t.createdAt
        }));

        if (mounted) {
          setOfficers(officersData);
          setTappals(tappalsData);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  // normalize helper
  const normalize = (s?: string) => (s || '').toLowerCase().trim();

  // explicit subordinate roles under Tahsildar
  const tahsildarSubordinates = [
    'naib tahsildar',
    'naib',
    'revenue inspector',
    'ri',
    'village revenue officer',
    'vro',
    'clerk'
  ];

  // find a Tahsildar from officers list (if present)
  const tahsildarOfficer = useMemo(() => {
    return officers.find(o => normalize(o.role).includes('tahsildar')) || null;
  }, [officers]);

  // determine which officers are subordinates of the Tahsildar
  const officersBelow = useMemo(() => {
    return officers.filter(o => {
      if (!o.role) return false;
      // exclude the tahsildar itself (if found)
      if (tahsildarOfficer && o.id === tahsildarOfficer.id) return false;
      const r = normalize(o.role);
      return tahsildarSubordinates.some(k => r.includes(k));
    });
  }, [officers, tahsildarOfficer]);

  // tappals assigned to those subordinate officers ONLY
  const officerTappals = useMemo(() => {
    const allowed = new Set(officersBelow.map(o => o.id));
    return tappals.filter(t => allowed.has(t.assignedTo));
  }, [tappals, officersBelow]);

  // departments derived from officerTappals + officersBelow
  const departments = useMemo(() => {
    const set = new Map<string, string>();
    officerTappals.forEach(t => {
      const id = (t.department || t.departmentName || '').trim();
      const label = (t.departmentName || t.department || id).trim();
      if (id) set.set(id, label || id);
    });
    officersBelow.forEach(o => {
      const id = (o.department || '').trim();
      if (id && !set.has(id)) set.set(id, id);
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [officerTappals, officersBelow]);

  // status options derived from officerTappals
  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    officerTappals.forEach(t => { if (t.status) s.add(t.status); });
    // keep common statuses too (optional)
    ['Pending', 'In Progress', 'Under Review', 'Completed', 'FORWARDED', 'Active', 'Rejected'].forEach(x => s.add(x));
    return Array.from(s);
  }, [officerTappals]);

  // filtered tappals (UI filters apply to officerTappals only)
  const filteredTappals = useMemo(() => {
    return officerTappals.filter(t => {
      const matchesDepartment = !filters.department || (t.department || t.departmentName || '').toLowerCase() === filters.department.toLowerCase();
      const matchesStatus = !filters.status || (t.status || '').toLowerCase() === filters.status.toLowerCase();
      const matchesOfficer = !filters.officer || t.assignedTo === filters.officer;
      return matchesDepartment && matchesStatus && matchesOfficer;
    });
  }, [officerTappals, filters]);

  // stats (derived from officerTappals)
  const stats = useMemo(() => {
    const total = officerTappals.length;
    const pending = officerTappals.filter(t => (t.status || '').toLowerCase().includes('pending') || (t.status || '').toLowerCase() === 'forwarded').length;
    const inProgress = officerTappals.filter(t => (t.status || '').toLowerCase().includes('progress') || (t.status || '').toLowerCase() === 'active').length;
    const completed = officerTappals.filter(t => (t.status || '').toLowerCase().includes('completed')).length;
    const overdue = officerTappals.filter(t => isOverdue(t.expiryDate || '', t.status || '')).length;
    return { total, pending, inProgress, completed, overdue };
  }, [officerTappals]);

  const getRoleDisplayName = (role: string) => {
    const r = normalize(role);
    if (r.includes('naib')) return 'Naib Tahsildar';
    if (r.includes('tahsildar')) return 'Tahsildar';
    if (r.includes('revenue') && r.includes('inspector')) return 'Revenue Inspector';
    if (r.includes('village') || r.includes('vro')) return 'Village Revenue Officer';
    if (r.includes('clerk')) return 'Clerk';
    return role;
  };

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600">Loading subordinate tappals...</p>
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

  // UI preserved — filters now use officersBelow, statusOptions, departments derived above
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subordinate Officer Tappals</h1>
        <p className="text-gray-600">Monitor tappals assigned to officers under your command</p>
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
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
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
          {/* Officer - only subordinate officers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Officer</label>
            <select
              value={filters.officer}
              onChange={(e) => setFilters(prev => ({ ...prev, officer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officersBelow.map(officer => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {getRoleDisplayName(officer.role)}
                </option>
              ))}
            </select>
          </div>

          {/* Status - only statuses present in subordinate tappals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.slice().sort((a, b) => a.localeCompare(b)).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Department - only relevant departments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.slice().sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)).map(d => (
                <option key={d.id} value={d.id}>{d.name || d.id}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Subordinate Officer Tappals ({filteredTappals.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tappal ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map((tappal) => {
                const overdueStatus = isOverdue(tappal.expiryDate || '', tappal.status || '');
                const daysOverdue = getDaysOverdue(tappal.expiryDate || '');

                const assignedOfficer = officers.find(o => o.id === tappal.assignedTo);
                const assignedRole = assignedOfficer ? getRoleDisplayName(assignedOfficer.role) : '';

                return (
                  <tr key={tappal.id || tappal.tappalId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTappalClick(tappal.tappalId)}
                        className="text-green-600 hover:text-green-800 font-medium flex items-center space-x-1"
                      >
                        <span>{tappal.tappalId}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{tappal.subject}</p>
                        <p className="text-xs text-gray-500 truncate">{tappal.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tappal.assignedToName || assignedOfficer?.name || '-'}</p>
                          <p className="text-xs text-gray-500">{assignedRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{tappal.departmentName || tappal.department || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status || '')}`}>
                        {tappal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tappal.priority || '')}`}>
                        {tappal.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-900">{formatDate(tappal.expiryDate || '')}</span>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tappals found</h3>
            <p className="text-gray-500">
              {officerTappals.length === 0 
                ? "No tappals have been assigned to officers under your command." 
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerTappals;
