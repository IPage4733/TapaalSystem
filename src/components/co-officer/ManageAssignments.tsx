import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../common/ToastContainer';
import { 
  FileText, 
  Users, 
  Building, 
  Calendar,
  User,
  Send,
  Filter,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const TAPPAL_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const DEPTS_URL = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const MOVEMENT_API_POST_BASE = 'https://eppkpabk61.execute-api.ap-southeast-1.amazonaws.com/dev/tapal'; // per-tappal forward POST

const ManageAssignments: React.FC = () => {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    assignedTo: ''
  });
  const [selectedTappals, setSelectedTappals] = useState<string[]>([]);
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  // live data
  const [tappalsFromApi, setTappalsFromApi] = useState<any[] | null>(null);
  const [departmentsFromApi, setDepartmentsFromApi] = useState<any[] | null>(null);
  const [officersFromApi, setOfficersFromApi] = useState<any[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // prefer API officers but fall back to mocks
  const officers = (officersFromApi && officersFromApi.length > 0 ? officersFromApi : mockUsers)
    .filter(u => u.role !== 'co_officer');

  const sourceTappals = (tappalsFromApi && tappalsFromApi.length > 0) ? tappalsFromApi : mockTappals;

  const filteredTappals = useMemo(() => {
    return sourceTappals.filter(tappal => {
      const matchesDepartment = !filters.department || (tappal.department === filters.department || tappal.departmentName === filters.department);
      const matchesStatus = !filters.status || tappal.status === filters.status;
      const matchesAssignedTo = !filters.assignedTo || tappal.assignedTo === filters.assignedTo;
      return matchesDepartment && matchesStatus && matchesAssignedTo;
    });
  }, [filters, sourceTappals]);

  const assignmentStats = useMemo(() => {
    const total = sourceTappals.length;
    const unassigned = sourceTappals.filter(t => !t.assignedTo).length;
    const pending = sourceTappals.filter(t => t.status === 'Pending').length;
    const completed = sourceTappals.filter(t => t.status === 'Completed').length;

    return { total, unassigned, pending, completed };
  }, [sourceTappals]);

  const statusOptions = ['Pending', 'In Progress', 'Under Review', 'Completed', 'Rejected'];

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      collector: 'District Collector',
      joint_collector: 'Joint Collector',
      dro: 'District Revenue Officer',
      rdo: 'Revenue Divisional Officer',
      tahsildar: 'Tahsildar',
      naib_tahsildar: 'Naib Tahsildar',
      ri: 'Revenue Inspector',
      vro: 'Village Revenue Officer',
      clerk: 'Clerk'
    };
    return roleNames[role] || role;
  };

  // --- Helpers for assignment/movement ------------------------------------
  const getOfficerById = (id?: string) => {
    if (!id) return null;
    return officers.find(o => String(o.id) === String(id) || String(o.employeeId) === String(id));
  };

  const resolveFromOfficerForTappal = (t: any) => {
    // try canonical fields on tappal, then lookup in officers
    if (!t) return { id: 'SYSTEM', name: 'System', role: 'clerk', phone: '' };

    const candidateId = t.assignedTo || t.assignToOfficer || t.assignTo || t.assignedToId || t.assignToOfficerId;
    if (candidateId) {
      const off = getOfficerById(candidateId);
      if (off) return { id: off.employeeId || off.id, name: off.fullName || off.name, role: off.role || off.position || 'clerk', phone: off.phone || off.phoneNumber || '' };
    }

    // fallback to tappal assignedToName if present
    if (t.assignedToName) {
      return { id: t.assignedTo || 'SYSTEM', name: t.assignedToName, role: t.assignedToRole || 'clerk', phone: t.assignedToPhone || '' };
    }

    // ultimate fallback
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

  // --- Single assign: create movement POST and then persist tappal assignment ---
  const handleSingleAssign = async (tappalId: string, officerId: string) => {
    const officer = getOfficerById(officerId) || mockUsers.find(o => o.id === officerId);
    // tappalId here is the stable identifier (tappal.tappalId || tappal.id)
    const tappal = sourceTappals.find(t => (t.tappalId && String(t.tappalId) === String(tappalId)) || (t.id && String(t.id) === String(tappalId)));

    if (!tappal) {
      showToast({ type: 'error', title: 'Not found', message: 'Selected tappal not found in source list.' });
      return;
    }
    if (!officer) {
      showToast({ type: 'error', title: 'Officer not found', message: 'Selected officer not found.' });
      return;
    }

    // build movement payload (forward reason empty string "")
    const from = resolveFromOfficerForTappal(tappal);
    const tappalIdentifier = tappal.tappalId || tappal.tappleId || tappal.id;
    const movementPayload = {
      fromOfficerId: from.id,
      toOfficerId: officer.employeeId || officer.id || 'UNKNOWN',
      reason: " ", // empty forward message as requested (single-space to satisfy backend)
      fromOfficerName: from.name,
      toOfficerName: officer.fullName || officer.name || 'Unknown',
      fromOfficerRole: from.role || 'clerk',
      toOfficerRole: officer.role || officer.position || '',
      fromDepartment: tappal.department || tappal.departmentName || '',
      toDepartment: officer.department || '',
      fromOfficerPhone: from.phone || "N/A",
      toOfficerPhone: officer.phone || officer.phoneNumber || '',
      status: 'Reassigned',
      timestamp: new Date().toISOString()
    };

    showToast({ type: 'info', title: 'Assigning...', message: `${tappalIdentifier} → ${officer.fullName || officer.name}` });

    try {
      // 1) POST movement for this tappal
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

      // 2) Persist assignment on tappal
      try {
        await updateTappalOnServer(tappalIdentifier, {
          assignedTo: officer.employeeId || officer.id,
          assignedToName: officer.fullName || officer.name
        });

        // optimistic UI update locally: update tappalsFromApi if present else ignore
        setTappalsFromApi(prev => {
          if (!prev) return prev;
          return prev.map(tp => {
            const key = tp.tappalId || tp.id;
            if (String(key) === String(tappalIdentifier)) {
              return { ...tp, assignedTo: officer.employeeId || officer.id, assignedToName: officer.fullName || officer.name };
            }
            return tp;
          });
        });

        showToast({ type: 'success', title: 'Assigned', message: `${tappalIdentifier} assigned to ${officer.fullName || officer.name}` });
      } catch (err: any) {
        console.error('PUT failed', err);
        showToast({ type: 'warning', title: 'Partial success', message: `Movement saved but assignment persist failed: ${err.message || err}` });
      }
    } catch (err: any) {
      console.error('Assign error', err);
      showToast({ type: 'error', title: 'Assign failed', message: err.message || 'Network error while assigning' });
    }
  };

  // --- Bulk assign: iterate selected tappals, POST movements and PUT assignment ---
  const handleBulkAssign = async () => {
    if (selectedTappals.length === 0 || !bulkAssignTo) {
      showToast({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select tappals and an officer for bulk assignment.'
      });
      return;
    }

    const officer = getOfficerById(bulkAssignTo) || mockUsers.find(o => o.id === bulkAssignTo);
    if (!officer) {
      showToast({ type: 'error', title: 'Officer not found', message: 'Selected officer not found.' });
      return;
    }

    showToast({ type: 'info', title: 'Bulk assigning', message: `Assigning ${selectedTappals.length} tappals to ${officer.fullName || officer.name}` });

    // build promises for all selected tappals
    const tasks = selectedTappals.map(async (tId) => {
      const tappal = sourceTappals.find(t => (t.tappalId && String(t.tappalId) === String(tId)) || (t.id && String(t.id) === String(tId)));
      if (!tappal) {
        return { id: tId, ok: false, error: 'Tappal not found' };
      }
      const from = resolveFromOfficerForTappal(tappal);
      const tappalIdentifier = tappal.tappalId || tappal.tappleId || tappal.id;

      const movementPayload = {
        fromOfficerId: from.id,
        toOfficerId: officer.employeeId || officer.id || 'UNKNOWN',
        reason: " ", // empty as requested
        fromOfficerName: from.name,
        toOfficerName: officer.fullName || officer.name || 'Unknown',
        fromOfficerRole: from.role || 'clerk',
        toOfficerRole: officer.role || officer.position || '',
        fromDepartment: tappal.department || tappal.departmentName || '',
        toDepartment: officer.department || '',
        fromOfficerPhone: from.phone ||"N/A",
        toOfficerPhone: officer.phone || officer.phoneNumber || '',
        status: 'Reassigned',
        timestamp: new Date().toISOString()
      };

      try {
        const postUrl = `${MOVEMENT_API_POST_BASE}/${encodeURIComponent(String(tappalIdentifier))}/forward`;
        const mvRes = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movementPayload)
        });

        if (!mvRes.ok) {
          const txt = await mvRes.text().catch(() => mvRes.statusText || 'POST failed');
          return { id: tappalIdentifier, ok: false, error: `Movement POST failed: ${mvRes.status} ${txt}` };
        }

        try {
          await updateTappalOnServer(tappalIdentifier, {
            assignedTo: officer.employeeId || officer.id,
            assignedToName: officer.fullName || officer.name
          });

          // optimistic local update
          setTappalsFromApi(prev => {
            if (!prev) return prev;
            return prev.map(tp => {
              const key = tp.tappalId || tp.id;
              if (String(key) === String(tappalIdentifier)) {
                return { ...tp, assignedTo: officer.employeeId || officer.id, assignedToName: officer.fullName || officer.name };
              }
              return tp;
            });
          });

          return { id: tappalIdentifier, ok: true };
        } catch (err: any) {
          return { id: tappalIdentifier, ok: false, error: `PUT failed: ${err.message || err}` };
        }
      } catch (err: any) {
        return { id: tappalIdentifier, ok: false, error: err.message || err };
      }
    });

    const results = await Promise.all(tasks);

    const succeeded = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);

    if (succeeded > 0) {
      showToast({ type: 'success', title: 'Bulk Assignment Complete', message: `${succeeded} tappals assigned to ${officer.fullName || officer.name}`, duration: 6000 });
      // clear selection only for succeeded ones
      setSelectedTappals(prev => prev.filter(id => failed.some(f => f.id === id)));
      setBulkAssignTo('');
      setShowBulkAssign(false);
    }

    if (failed.length > 0) {
      showToast({ type: 'error', title: 'Some assignments failed', message: `${failed.length} failed. See console for details.` });
      console.error('Bulk assign failures', failed);
    }
  };

  const handleSelectTappal = (tappalId: string) => {
    setSelectedTappals(prev => 
      prev.includes(tappalId) 
        ? prev.filter(id => id !== tappalId)
        : [...prev, tappalId]
    );
  };

  const handleSelectAll = () => {
    const keys = filteredTappals.map(t => t.tappalId || t.id);
    if (selectedTappals.length === keys.length) {
      setSelectedTappals([]);
    } else {
      setSelectedTappals(keys);
    }
  };

  // --- load live tappals / depts / officers (same as before) ----------------
  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoadingData(true);
      try {
        const [tRes, dRes, oRes] = await Promise.all([
          fetch(TAPPAL_API).then(r => r.ok ? r.json() : Promise.reject(new Error('Tappal fetch failed'))),
          fetch(DEPTS_URL).then(r => r.ok ? r.json() : Promise.reject(new Error('Departments fetch failed'))),
          fetch(OFFICER_API).then(r => r.ok ? r.json() : Promise.reject(new Error('Officers fetch failed')))
        ]);

        const tappalList = Array.isArray(tRes) ? tRes : (tRes?.data || tRes?.items || []);
        const departmentsList = Array.isArray(dRes) ? dRes : (dRes?.departments || dRes?.data || []);
        const officerList = Array.isArray(oRes) ? oRes : (oRes?.officers || oRes?.data || []);

        if (!mounted) return;
        setTappalsFromApi(Array.isArray(tappalList) ? tappalList : []);
        setDepartmentsFromApi(Array.isArray(departmentsList) ? departmentsList : []);
        setOfficersFromApi(Array.isArray(officerList) ? officerList : []);
      } catch (err:any) {
        console.error('Data load error', err);
        showToast({ type: 'error', title: 'Load error', message: err?.message || 'Failed to load data' });
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    loadAll();
    return () => { mounted = false; };
  }, [showToast]);

  const departmentsToShow = (departmentsFromApi && departmentsFromApi.length > 0)
    ? departmentsFromApi
    : mockDepartments;

  // ---------------------- UI (unchanged) -----------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Assignments</h1>
              <p className="text-gray-600">Assign and reassign tappals to appropriate officers</p>
            </div>
          </div>
          <button
            onClick={() => setShowBulkAssign(!showBulkAssign)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send className="h-4 w-4 mr-2" />
            Bulk Assign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-purple-600">{assignmentStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{assignmentStats.pending}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{assignmentStats.completed}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers</p>
              <p className="text-2xl font-bold text-blue-600">{officers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Bulk Assignment Panel */}
      {showBulkAssign && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">Bulk Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Selected Tappals
              </label>
              <div className="text-2xl font-bold text-purple-600">{selectedTappals.length}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Assign to Officer
              </label>
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select officer...</option>
                {officers.map(officer => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} - {getRoleDisplayName(officer.role)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBulkAssign}
                disabled={selectedTappals.length === 0 || !bulkAssignTo}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departmentsToShow.map(dept => (
                <option key={dept.id} value={dept.name || dept.departmentName || dept.id}>{dept.name || dept.departmentName}</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Tappal Assignments ({filteredTappals.length})
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {selectedTappals.length === filteredTappals.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTappals.length === filteredTappals.length && filteredTappals.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tappal ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currently Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTappals.map((tappal) => {
                const tappalKey = tappal.tappalId || tappal.id; // stable id for selection/actions
                return (
                  <tr key={tappalKey} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTappals.includes(tappalKey)}
                        onChange={() => handleSelectTappal(tappalKey)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => window.open(`/tappal/${tappal.tappalId}`, '_blank')}
                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
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
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{tappal.departmentName || tappal.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{tappal.assignedToName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                        {tappal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tappal.priority)}`}>
                        {tappal.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        onChange={(e) => e.target.value && handleSingleAssign(tappalKey, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        defaultValue=""
                      >
                        <option value="">Reassign to...</option>
                        {officers.filter(o => o.id !== tappal.assignedTo).map(officer => (
                          <option key={officer.id} value={officer.id}>
                            {officer.name} - {getRoleDisplayName(officer.role)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tappals found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAssignments;
