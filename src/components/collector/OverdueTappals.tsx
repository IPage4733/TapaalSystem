import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import {
  AlertTriangle,
  Clock,
  Filter,
  User,
  Building,
  Calendar,
  ExternalLink,
  ArrowUp,
  UserX
} from 'lucide-react';
import { formatDate, getDaysOverdue, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

// API endpoints (provided by you)
const TAPPAL_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const DEPTS_URL = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const MOVEMENT_API_POST_BASE = 'https://eppkpabk61.execute-api.ap-southeast-1.amazonaws.com/dev/tapal';

// Types
type Tappal = {
  id?: string;
  tappalId?: string;
  subject?: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  department?: string; // may be id or name depending on API
  departmentName?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
  expiryDate?: string;
  petitionId?: string;
  isConfidential?: boolean;
  lastUpdated?: string;
  comments?: any[];
  attachments?: any[];
  daysOverdue?: number;
};

type Officer = {
  id?: string;
  employeeId?: string;
  name?: string;
  fullName?: string;
  role?: string;
  phone?: string;
  department?: string;
};

type Department = { id: string; departmentName?: string; name?: string };

// Role ranking: lower number = higher authority
const ROLE_RANK: Record<string, number> = {
  'co-officer': 0,
  'system admin': 0,
  'district collector': 1,
  'collector': 1,
  'joint collector': 2,
  'district revenue officer': 3,
  'dro': 3,
  'revenue divisional officer': 4,
  'rdo': 4,
  'tahsildar': 5,
  'naib tahsildar': 6,
  'revenue inspector': 7,
  'ri': 7,
  'village revenue officer': 8,
  'vro': 8,
  'clerk': 9
};

const normalizeRole = (raw?: string) => {
  if (!raw) return '';
  return raw.toLowerCase().trim();
};

const roleRankOf = (raw?: string) => {
  const r = normalizeRole(raw);
  // try exact map
  if (ROLE_RANK.hasOwnProperty(r)) return ROLE_RANK[r];
  // try substrings
  if (r.includes('collector')) return ROLE_RANK['district collector'];
  if (r.includes('joint')) return ROLE_RANK['joint collector'];
  if (r.includes('district revenue') || r.includes('dro')) return ROLE_RANK['district revenue officer'];
  if (r.includes('revenue divisional') || r.includes('rdo')) return ROLE_RANK['revenue divisional officer'];
  if (r.includes('tahsildar')) return ROLE_RANK['tahsildar'];
  if (r.includes('naib')) return ROLE_RANK['naib tahsildar'];
  if (r.includes('revenue inspector') || r.includes('inspector') || r.includes('ri')) return ROLE_RANK['revenue inspector'];
  if (r.includes('village') || r.includes('vro')) return ROLE_RANK['village revenue officer'];
  if (r.includes('clerk')) return ROLE_RANK['clerk'];
  if (r.includes('admin') || r.includes('co-officer') || r.includes('co officer')) return ROLE_RANK['co-officer'];
  return ROLE_RANK['clerk'];
};

const OverdueTappals: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [filters, setFilters] = useState({ department: '', severity: '' });

  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officersList, setOfficersList] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state for per-row reassign
  const [reassignLoading, setReassignLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ac = new AbortController();

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [tResp, dResp, oResp] = await Promise.all([
          fetch(TAPPAL_API, { signal: ac.signal }),
          fetch(DEPTS_URL, { signal: ac.signal }),
          fetch(OFFICER_API, { signal: ac.signal })
        ]);

        if (!tResp.ok) throw new Error(`Tappal API returned ${tResp.status}`);
        if (!dResp.ok) throw new Error(`Departments API returned ${dResp.status}`);
        if (!oResp.ok) throw new Error(`Officer API returned ${oResp.status}`);

        const tappalData = await tResp.json();
        const deptData = await dResp.json();
        const officerData = await oResp.json();

        const deptList: Department[] = Array.isArray(deptData) ? deptData : (deptData?.data || deptData?.items || []);
        const officersArray: Officer[] = Array.isArray(officerData) ? officerData : (officerData?.officers || officerData?.data || []);
        const tappalList: Tappal[] = Array.isArray(tappalData) ? tappalData : (tappalData?.data || tappalData?.items || []);

        // Normalize tappals: ensure fields exist, calculate daysOverdue
        const mapped = tappalList.map((t: Tappal) => {
          const days = getDaysOverdue(t.expiryDate || '');
          let deptName = t.departmentName;
          if (!deptName && t.department) {
            const matched = deptList.find(d => d.id === t.department || d.departmentName === t.department || d.name === t.department);
            deptName = matched ? matched.departmentName || matched.name : t.department;
          }

          return {
            ...t,
            departmentName: deptName || '',
            assignedToName: t.assignedToName || '',
            daysOverdue: days
          };
        });

        setTappals(mapped);
        setDepartments(deptList);
        setOfficersList(officersArray);
        setLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    }

    fetchAll();
    return () => ac.abort();
  }, []);

  // helpers
  const getOfficerById = (id?: string) => {
    if (!id) return null;
    return officersList.find(o => String(o.id) === String(id) || String(o.employeeId) === String(id));
  };

  const resolveFromOfficerForTappal = (t: Tappal) => {
    if (!t) return { id: 'SYSTEM', name: 'System', role: 'clerk', phone: '' };
    const candidateId = t.assignedTo || (t as any).assignToOfficer || (t as any).assignTo || (t as any).assignedToId || (t as any).assignToOfficerId;
    if (candidateId) {
      const off = getOfficerById(candidateId);
      if (off) return { id: off.employeeId || off.id, name: off.fullName || off.name || off.employeeId || off.id, role: off.role || 'clerk', phone: off.phone || '' };
    }

    if (t.assignedToName) {
      return { id: t.assignedTo || 'SYSTEM', name: t.assignedToName, role: (t as any).assignedToRole || 'clerk', phone: (t as any).assignedToPhone || '' };
    }

    return { id: 'SYSTEM', name: 'System', role: 'clerk', phone: '' };
  };

  const updateTappalOnServer = async (tappalIdentifier: string, fields: Record<string, any>) => {
    if (!tappalIdentifier) throw new Error('Missing tappal identifier for update');
    const payload = { tappalId: tappalIdentifier, ...fields };
    const putUrl = `${TAPPAL_API}/${encodeURIComponent(String(tappalIdentifier))}`;
    const res = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText || 'PUT failed');
      throw new Error(`Tappal update failed: ${res.status} ${text}`);
    }
    const json = await res.json().catch(() => ({}));
    return json;
  };

  // find the immediate parent officer or fallback to the next available higher level
  // This will try targetRank = currentRank - 1, then -2, ... down to 0 (co-officer/system admin)
  // At each rank it prefers same-department candidates before falling back to any officer at that rank.
  const findParentOrHigher = (currentOfficerId?: string) => {
    if (!officersList || officersList.length === 0) return null;

    const current = getOfficerById(currentOfficerId);
    const currentRoleRaw = current?.role || current?.name || '';
    const currentRank = roleRankOf(currentRoleRaw);

    // if current is already top-level, nothing above it
    if (currentRank <= 0) return null;

    // try ranks from immediate parent up to top (decreasing rank value)
    for (let targetRank = currentRank - 1; targetRank >= 0; targetRank--) {
      const candidates = officersList
        .map(o => ({ officer: o, rank: roleRankOf(o.role || o.name || '') }))
        .filter(x => x.rank === targetRank)
        .map(x => x.officer);

      if (candidates.length === 0) continue;

      // prefer same department
      if (current && current.department) {
        const sameDept = candidates.find(o => String(o.department) === String(current.department));
        if (sameDept) return sameDept;
      }

      // otherwise return the first candidate at this rank
      return candidates[0];
    }

    return null;
  };

  // escalate: auto reassign tappal to the immediate parent authority
  const handleEscalateAuto = async (tappalKey: string) => {
    const tappal = tappals.find(t => (t.tappalId && String(t.tappalId) === String(tappalKey)) || (t.id && String(t.id) === String(tappalKey)));
    if (!tappal) {
      showToast({ type: 'error', title: 'Not found', message: 'Tappal not found.' });
      return;
    }

    const current = resolveFromOfficerForTappal(tappal);
    const parent = findParentOrHigher(current.id);

    if (!parent) {
      showToast({ type: 'info', title: 'No immediate parent', message: 'No immediate parent authority found to escalate to.' });
      return;
    }

    setReassignLoading(prev => ({ ...prev, [tappalKey]: true }));
    showToast({ type: 'info', title: 'Escalating', message: `Escalating ${tappalKey} to ${parent.fullName || parent.name}` });

    try {
      const tappalIdentifier = tappal.tappalId || tappal.id;
      const from = current;
      const movementPayload = {
        fromOfficerId: from.id,
        toOfficerId: parent.employeeId || parent.id || 'UNKNOWN',
        reason: 'Escalated due to overdue',
        fromOfficerName: from.name,
        toOfficerName: parent.fullName || parent.name || 'Unknown',
        fromOfficerRole: from.role || 'clerk',
        toOfficerRole: parent.role || parent.position || '',
        fromDepartment: tappal.department || tappal.departmentName || '',
        toDepartment: parent.department || '',
        fromOfficerPhone: from.phone || 'N/A',
        toOfficerPhone: parent.phone || parent.phoneNumber || '',
        status: 'Escalated',
        timestamp: new Date().toISOString()
      };

      const postUrl = `${MOVEMENT_API_POST_BASE}/${encodeURIComponent(String(tappalIdentifier))}/forward`;
      const mvRes = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementPayload)
      });

      if (!mvRes.ok) {
        const txt = await mvRes.text().catch(() => mvRes.statusText || 'POST failed');
        throw new Error(`Movement POST failed: ${mvRes.status} ${txt}`);
      }

      // persist assignment to parent officer
      try {
        await updateTappalOnServer(String(tappalIdentifier), {
          assignedTo: parent.employeeId || parent.id,
          assignedToName: parent.fullName || parent.name
        });

        setTappals(prev => prev.map(tp => {
          const key = tp.tappalId || tp.id;
          if (String(key) === String(tappalIdentifier)) {
            return { ...tp, assignedTo: parent.employeeId || parent.id, assignedToName: parent.fullName || parent.name };
          }
          return tp;
        }));

        showToast({ type: 'success', title: 'Escalated', message: `${tappalIdentifier} escalated to ${parent.fullName || parent.name}` });
      } catch (err: any) {
        console.error('PUT failed', err);
        showToast({ type: 'warning', title: 'Partial success', message: `Movement saved but assignment persist failed: ${err.message || err}` });
      }
    } catch (err: any) {
      console.error('Escalate error', err);
      showToast({ type: 'error', title: 'Escalation failed', message: err.message || 'Network error while escalating' });
    } finally {
      setReassignLoading(prev => ({ ...prev, [tappalKey]: false }));
    }
  };

  // Reassign immediate (same as ManageAssignments)
  const handleReassignImmediate = async (tappalKey: string, officerId: string) => {
    if (!officerId) return; // user picked the placeholder

    const tappal = tappals.find(t => (t.tappalId && String(t.tappalId) === String(tappalKey)) || (t.id && String(t.id) === String(tappalKey)));
    if (!tappal) {
      showToast({ type: 'error', title: 'Not found', message: 'Tappal not found in list.' });
      return;
    }

    const officer = getOfficerById(officerId);
    if (!officer) {
      showToast({ type: 'error', title: 'Officer not found', message: 'Selected officer not found.' });
      return;
    }

    setReassignLoading(prev => ({ ...prev, [tappalKey]: true }));
    showToast({ type: 'info', title: 'Assigning...', message: `${tappalKey} → ${officer.fullName || officer.name}` });

    try {
      const from = resolveFromOfficerForTappal(tappal);
      const tappalIdentifier = tappal.tappalId || tappal.id;
      const movementPayload = {
        fromOfficerId: from.id,
        toOfficerId: officer.employeeId || officer.id || 'UNKNOWN',
        reason: ' ',
        fromOfficerName: from.name,
        toOfficerName: officer.fullName || officer.name || 'Unknown',
        fromOfficerRole: from.role || 'clerk',
        toOfficerRole: officer.role || officer.position || '',
        fromDepartment: tappal.department || tappal.departmentName || '',
        toDepartment: officer.department || '',
        fromOfficerPhone: from.phone || 'N/A',
        toOfficerPhone: officer.phone || officer.phoneNumber || '',
        status: 'Reassigned',
        timestamp: new Date().toISOString()
      };

      const postUrl = `${MOVEMENT_API_POST_BASE}/${encodeURIComponent(String(tappalIdentifier))}/forward`;
      const mvRes = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementPayload)
      });

      if (!mvRes.ok) {
        const txt = await mvRes.text().catch(() => mvRes.statusText || 'POST failed');
        throw new Error(`Movement POST failed: ${mvRes.status} ${txt}`);
      }

      // persist assignment
      try {
        await updateTappalOnServer(String(tappalIdentifier), {
          assignedTo: officer.employeeId || officer.id,
          assignedToName: officer.fullName || officer.name
        });

        setTappals(prev => prev.map(tp => {
          const key = tp.tappalId || tp.id;
          if (String(key) === String(tappalIdentifier)) {
            return { ...tp, assignedTo: officer.employeeId || officer.id, assignedToName: officer.fullName || officer.name };
          }
          return tp;
        }));

        showToast({ type: 'success', title: 'Assigned', message: `${tappalIdentifier} assigned to ${officer.fullName || officer.name}` });
      } catch (err: any) {
        console.error('PUT failed', err);
        showToast({ type: 'warning', title: 'Partial success', message: `Movement saved but assignment persist failed: ${err.message || err}` });
      }
    } catch (err: any) {
      console.error('Assign error', err);
      showToast({ type: 'error', title: 'Assign failed', message: err.message || 'Network error while assigning' });
    } finally {
      setReassignLoading(prev => ({ ...prev, [tappalKey]: false }));
    }
  };

  const overdueTappals = useMemo(() => {
    const today = new Date();
    return tappals
      .filter(t => {
        if (!t.expiryDate) return false;
        const expiry = new Date(t.expiryDate);
        return today > expiry && (t.status || '').toLowerCase() !== 'completed';
      })
      .map(t => ({ ...t, daysOverdue: getDaysOverdue(t.expiryDate) }));
  }, [tappals]);

  const filteredTappals = useMemo(() => {
    return overdueTappals.filter(tappal => {
      const matchesDepartment = !filters.department || tappal.department === filters.department || tappal.departmentName === filters.department;

      let matchesSeverity = true;
      if (filters.severity === '1-7') {
        matchesSeverity = (tappal.daysOverdue || 0) >= 1 && (tappal.daysOverdue || 0) <= 7;
      } else if (filters.severity === '7+') {
        matchesSeverity = (tappal.daysOverdue || 0) > 7;
      }

      return matchesDepartment && matchesSeverity;
    }).sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));
  }, [overdueTappals, filters]);

  const overdueStats = useMemo(() => {
    const total = overdueTappals.length;
    const mild = overdueTappals.filter(t => (t.daysOverdue || 0) >= 1 && (t.daysOverdue || 0) <= 7).length;
    const severe = overdueTappals.filter(t => (t.daysOverdue || 0) > 7).length;
    const critical = overdueTappals.filter(t => (t.daysOverdue || 0) > 30).length;
    const avgDaysOverdue = total > 0 ? Math.round(overdueTappals.reduce((sum, t) => sum + (t.daysOverdue || 0), 0) / total) : 0;

    return { total, mild, severe, critical, avgDaysOverdue };
  }, [overdueTappals]);

  const getSeverityColor = (days: number | undefined) => {
    const d = days || 0;
    if (d > 30) return 'text-red-700 bg-red-100 border-red-200';
    if (d > 7) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getSeverityLabel = (days: number | undefined) => {
    const d = days || 0;
    if (d > 30) return 'Critical';
    if (d > 7) return 'Severe';
    return 'Mild';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading tappals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overdue Tappals</h1>
            <p className="text-gray-600">Monitor and manage overdue tappals requiring immediate attention</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueStats.total}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">1-7 Days</p>
              <p className="text-2xl font-bold text-orange-600">{overdueStats.mild}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">7+ Days</p>
              <p className="text-2xl font-bold text-red-600">{overdueStats.severe}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical (30+)</p>
              <p className="text-2xl font-bold text-red-700">{overdueStats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Days</p>
              <p className="text-2xl font-bold text-gray-900">{overdueStats.avgDaysOverdue}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.departmentName || dept.name || dept.id}>{dept.departmentName || dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Severities</option>
              <option value="1-7">1-7 Days Overdue</option>
              <option value="7+">7+ Days Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overdue Tappals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Overdue Tappals ({filteredTappals.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tappal ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map((tappal) => (
                <tr key={tappal.tappalId || tappal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => navigate(`/tappal/${tappal.tappalId}`)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1">
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
                      <span className="text-sm text-gray-900">{tappal.assignedToName || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{tappal.departmentName || tappal.department || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(tappal.daysOverdue)}`}>
                        {tappal.daysOverdue} days
                      </span>
                      <span className={`text-xs font-medium ${getSeverityColor(tappal.daysOverdue).split(' ')[0]}`}>
                        {getSeverityLabel(tappal.daysOverdue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tappal.priority)}`}>
                      {tappal.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                      {tappal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEscalateAuto(tappal.tappalId || tappal.id || '')}
                        className="inline-flex items-center px-3 py-1 border border-red-300 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Escalate
                      </button>

                      {/* Reassign: match ManageAssignments UX - single select that triggers assign immediately */}
                      <select
                        onChange={(e) => {
                          const officerId = e.target.value;
                          if (!officerId) return;
                          handleReassignImmediate(tappal.tappalId || tappal.id || '', officerId);
                          // reset the select back to placeholder after short delay for UX
                          e.currentTarget.selectedIndex = 0;
                        }}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue=""
                      >
                        <option value="">Reassign to...</option>
                        {officersList.filter(o => String(o.id) !== String(tappal.assignedTo)).map(off => (
                          <option key={off.id || off.employeeId} value={off.id || off.employeeId}>
                            {off.fullName || off.name} {off.role ? `- ${off.role}` : ''}
                          </option>
                        ))}
                      </select>

                      {/* show small loader text when this tappal is reassigning */}
                      {reassignLoading[tappal.tappalId || tappal.id] && (
                        <span className="text-xs text-gray-500">Saving...</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue tappals found</h3>
            <p className="text-gray-500">{overdueStats.total === 0 ? "Great! All tappals are on track." : "Try adjusting your filters to see more results."}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {filteredTappals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Immediate Action Required</h3>
              <p className="text-red-700 mb-4">{filteredTappals.length} tappals are overdue and require immediate attention. Consider escalating critical cases or reassigning to available officers.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => {
                  const criticalTappals = filteredTappals.filter(t => (t.daysOverdue || 0) > 30);
                  if (criticalTappals.length > 0) {
                    // escalate all critical tappals one-by-one to higher authority
                    criticalTappals.forEach(t => handleEscalateAuto(t.tappalId || t.id || ''));
                    showToast({ type: 'warning', title: 'Bulk Escalation', message: `${criticalTappals.length} critical tappals have been escalated to higher authority.`, duration: 6000 });
                  } else {
                    showToast({ type: 'info', title: 'No Critical Tappals', message: 'No tappals found that require critical escalation.', duration: 4000 });
                  }
                }} className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors">
                  <ArrowUp className="h-4 w-4 mr-2" />Escalate Critical Cases
                </button>
                <button onClick={() => showToast({ type: 'info', title: 'Bulk Reassignment', message: 'Opening bulk reassignment interface. Feature will be available soon.', duration: 5000 })} className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                  <UserX className="h-4 w-4 mr-2" />Bulk Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueTappals;
