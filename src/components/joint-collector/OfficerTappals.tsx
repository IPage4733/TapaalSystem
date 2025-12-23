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
import {
  formatDate,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  getDaysOverdue
} from '../../utils/dateUtils';

/* ================= HELPER FUNCTIONS ================= */
const formatStatus = (status: string): string => {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const displayDepartmentName = (name?: string) => {
  if (!name) return '';
  const n = name.trim();
  if (n.toLowerCase().includes('revenue')) return 'Revenue Department';
  return n;
};

/* ================= APIs ================= */
const OFFICER_API =
  'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const TAPPAL_API =
  'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const DEPT_API =
  'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';

const OfficerTappals: React.FC = () => {
  const navigate = useNavigate();

  const [officers, setOfficers] = useState<any[]>([]);
  const [tappals, setTappals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    department: '',
    status: '',
    officer: ''
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [o, t, d] = await Promise.all([
          fetch(OFFICER_API).then(r => r.json()),
          fetch(TAPPAL_API).then(r => r.json()),
          fetch(DEPT_API).then(r => r.json())
        ]);

        const fetchedOfficers = o.officers || [];
        const fetchedTappals = t.tappals || t || [];
        const fetchedDepartments = d || [];

        // Build maps for department code <-> name lookups
        const codeToName = new Map<string, string>();
        const nameToCode = new Map<string, string>();
        fetchedDepartments.forEach((dep: any) => {
          if (dep.departmentCode && dep.departmentName) {
            codeToName.set(dep.departmentCode, dep.departmentName);
            nameToCode.set(dep.departmentName, dep.departmentCode);
          }
        });

        // Normalize tappals to include a departmentName and departmentCode for reliable filtering/display
        const normalizedTappals = fetchedTappals.map((tp: any) => {
          // Determine a departmentCode for the tappal. The tappal API may provide either
          // a code (tp.department) or a name (tp.department) or an explicit tp.departmentCode.
          const deptField = tp.department;
          const deptCodeFromField = deptField && codeToName.has(deptField) ? deptField : nameToCode.get(deptField);
          const departmentCode = tp.departmentCode || deptCodeFromField || '';

          const departmentName = tp.departmentName || codeToName.get(departmentCode) || tp.department || '';

          return {
            ...tp,
            departmentCode,
            departmentName
          };
        });

        setOfficers(fetchedOfficers);
        setTappals(normalizedTappals);
        setDepartments(fetchedDepartments);
      } catch (e) {
        console.error('API Error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ================= UNIQUE DEPARTMENTS ================= */
  const uniqueDepartments = useMemo(() => {
    const map = new Map<string, any>();
    departments.forEach(dep => {
      if (!map.has(dep.departmentCode)) {
        map.set(dep.departmentCode, dep);
      }
    });
    const list = Array.from(map.values());
    list.sort((a: any, b: any) => (a.departmentName || '').localeCompare(b.departmentName || ''));
    return list;
  }, [departments]);

  /* ================= LOGIC (UNCHANGED) ================= */
  const officersBelow = useMemo(
    () =>
      // Include joint_collector roles as well so joint-collector officers
      // appear in the officer dropdown (only exclude top-level collectors)
      officers.filter(
        o => o.role !== 'collector'
      ),
    [officers]
  );

  const officerTappals = useMemo(() => {
    const ids = officersBelow.map(o => o.id);
    return tappals.filter(t => ids.includes(t.assignedTo));
  }, [tappals, officersBelow]);

  // Officers to show in the dropdown: only those who have tappals
  // Consider current department/status filters so the dropdown reflects available choices
  const officersForDropdown = useMemo(() => {
    let base = officerTappals;
    if (filters.department) {
      base = base.filter(t =>
        String(t.departmentCode) === String(filters.department) ||
        String(t.department) === String(filters.department) ||
        String(t.departmentName) === String(filters.department)
      );
    }
    if (filters.status) {
      base = base.filter(t => t.status === filters.status);
    }
    const ids = new Set(base.map(t => String(t.assignedTo)));
    // Filter officers who have tappals in the (optionally) filtered set
    const filteredOfficers = officersBelow.filter(o => ids.has(String(o.id)));

    // Deduplicate by officer name: only show each name once in dropdown
    const nameMap = new Map<string, any>();
    filteredOfficers.forEach(o => {
      const nameKey = (o.name || '').trim();
      if (!nameMap.has(nameKey.toLowerCase())) {
        nameMap.set(nameKey.toLowerCase(), o);
      }
    });

    return Array.from(nameMap.values()).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }, [officerTappals, officersBelow, filters.department, filters.status]);

  // If the currently selected officer is no longer available in dropdown, clear it
  useEffect(() => {
    if (filters.officer && !officersForDropdown.some(o => String(o.name) === String(filters.officer))) {
      setFilters(prev => ({ ...prev, officer: '' }));
    }
  }, [officersForDropdown, filters.officer]);

  const filteredTappals = useMemo(() => {
    return officerTappals.filter(t =>
      (!filters.department || String(t.departmentCode) === String(filters.department) || String(t.department) === String(filters.department) || String(t.departmentName) === String(filters.department)) &&
      (!filters.status || t.status?.toUpperCase() === filters.status?.toUpperCase()) &&
      (!filters.officer || String(t.assignedTo) === String(filters.officer) || String(t.assignedToName) === String(filters.officer))
    );
  }, [officerTappals, filters]);

  const stats = useMemo(() => ({
    total: officerTappals.length,
    pending: officerTappals.filter(t => t.status === 'Pending').length,
    inProgress: officerTappals.filter(t => t.status === 'In Progress').length,
    completed: officerTappals.filter(t => t.status === 'Completed').length,
    overdue: officerTappals.filter(t =>
      isOverdue(t.expiryDate, t.status)
    ).length
  }), [officerTappals]);

  /* ================= AVAILABLE STATUSES ================= */
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    officerTappals.forEach(t => {
      if (t.status) {
        statusSet.add(formatStatus(t.status));
      }
    });
    return Array.from(statusSet).sort();
  }, [officerTappals]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        Loading Officer-wise Tappals...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Officer-wise Tappals Tracker
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor tappals assigned to officers under your supervision
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          ['Total Tappals', stats.total, FileText, 'text-gray-700'],
          ['Pending', stats.pending, Calendar, 'text-orange-500'],
          ['In Progress', stats.inProgress, Users, 'text-blue-500'],
          ['Completed', stats.completed, Calendar, 'text-green-600'],
          ['Overdue', stats.overdue, Calendar, 'text-red-500']
        ].map(([label, value, Icon, color]: any) => (
          <div
            key={label}
            className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        ))}
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-800">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Department */}
          <div>
            <label className="text-sm text-gray-600">Department</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={filters.department}
              onChange={e =>
                setFilters({ ...filters, department: e.target.value })
              }
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map(d => (
                <option
                  key={d.departmentCode}
                  value={d.departmentCode}
                >
                  {displayDepartmentName(d.departmentName)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={filters.status}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Status</option>
              {availableStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Officer */}
          <div>
            <label className="text-sm text-gray-600">Officer</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={filters.officer}
              onChange={e =>
                setFilters({ ...filters, officer: e.target.value })
              }
            >
              <option value="">All Officers</option>
              {officersForDropdown.map(o => (
                <option key={o.name} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b font-semibold">
          Officer Tappals ({filteredTappals.length})
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {[
                'TAPPAL ID',
                'SUBJECT',
                'ASSIGNED TO',
                'DEPARTMENT',
                'STATUS',
                'PRIORITY',
                'EXPIRY'
              ].map(h => (
                <th key={h} className="px-6 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredTappals.map(t => (
              <tr
                key={t.id || t.tappalId}
                className="border-t hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <span
                    onClick={() => navigate(`/tappal/${t.tappalId}`)}
                    className="text-indigo-600 font-medium cursor-pointer flex items-center gap-1"
                  >
                    {t.tappalId}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </td>

                <td className="px-6 py-4 font-medium">
                  {t.subject}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {t.assignedToName}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    {t.departmentName}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(t.status)}`}>
                    {formatStatus(t.status)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(t.priority)}`}>
                    {t.priority}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {formatDate(t.expiryDate)}
                  {isOverdue(t.expiryDate, t.status) && (
                    <div className="text-xs text-red-600 font-medium">
                      {getDaysOverdue(t.expiryDate)} days overdue
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTappals.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No Officer-wise Tappals Found
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerTappals;