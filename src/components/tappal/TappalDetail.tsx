import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommentsByTappalId, addComment as addCommentApi, deleteComment as deleteCommentApi } from '../../services/commentService';
import { updateTapalStatus } from '../../services/tapalApiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import {
  FileText,
  Calendar,
  Clock,
  User,
  Phone,
  Building,
  ArrowRight,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Send,
  Download,
  Eye,
  X,
  ArrowLeft,
  MapPin,
  MessageSquare,
  Plus,
  Edit,
  Save
} from 'lucide-react';
import { formatDate, formatDateTime, getDaysOverdue, isOverdue, getStatusColor, getPriorityColor } from '../../utils/dateUtils';
import { Tappal } from '../../types/Tappal';

const TAPPAL_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const MOVEMENT_API_BULK = 'https://zq5wahnb2d.execute-api.ap-southeast-1.amazonaws.com/dev/forward';
const MOVEMENT_API_BY_TAPPAL_BASE = 'https://vy97mh9b60.execute-api.ap-southeast-1.amazonaws.com/dev/tapal';
const MOVEMENT_API_POST_BASE = 'https://eppkpabk61.execute-api.ap-southeast-1.amazonaws.com/dev/tapal';
const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';

const TappalDetail: React.FC = () => {
  const { tappalId } = useParams<{ tappalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // data state
  const [loading, setLoading] = useState(true);
  const [tappal, setTappal] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [assignedOfficer, setAssignedOfficer] = useState<any | null>(null);

  // UI state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [forwardForm, setForwardForm] = useState({ toOfficerId: '', reason: '' });
  const [commentForm, setCommentForm] = useState({ comment: '' });
  const [statusForm, setStatusForm] = useState({ newStatus: '', reason: '' });
  const [forwardLoading, setForwardLoading] = useState(false);

  // --- Helpers: normalize and resolve -------------------------------------
  const normalizeTappalId = (t: any) => t?.tappalId || t?.tappleId || t?.tappalID || t?.tappleID || '';

  const normalizeMovement = (m: any, idx: number) => ({
    id: m.forwardId || m.id || `mv-${idx}`,
    tappalId: m.tappalId || m.tappleId || '',
    fromOfficerId: m.fromOfficerId || m.from || m.fromOfficer || '',
    toOfficerId: m.toOfficerId || m.to || m.toOfficer || '',
    fromOfficerName: m.fromOfficerName || m.fromOfficer || m.fromName || m.fromName || 'Unknown',
    toOfficerName: m.toOfficerName || m.toOfficer || m.toName || 'Unknown',
    fromOfficerRole: m.fromOfficerRole || m.fromRole || 'clerk',
    toOfficerRole: m.toOfficerRole || m.toRole || 'clerk',
    fromOfficerPhone: m.fromOfficerPhone || m.fromPhone || '',
    toOfficerPhone: m.toOfficerPhone || m.toPhone || '',
    reason: m.reason || m.remark || m.description || '',
    status: m.status || 'Received',
    // normalize timestamp field name variants to ISO string
    timestamp: m.createdAt || m.timestamp || m.createdAtTime || new Date().toISOString()
  });

  // human-friendly duration formatter
  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '0m';
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60) % 60;
    const hours = Math.floor(secs / 3600) % 24;
    const days = Math.floor(secs / 86400);

    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (mins) parts.push(`${mins}m`);
    if (parts.length === 0) return `${Math.floor(secs)}s`;
    return parts.join(' ');
  };

  const buildMovementsForTappal = (id: string, movementsRaw: any[]) => {
    if (!id || !Array.isArray(movementsRaw)) return [];
    const filtered = movementsRaw.filter(m => {
      // robust checks across different field names
      const mid = m.tappalId || m.tappleId || '';
      return String(mid).toString() === String(id).toString();
    });
    const mapped = filtered.map((m, i) => normalizeMovement(m, i));
    mapped.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // compute duration each movement represents until the next movement timestamp
    for (let i = 0; i < mapped.length; i++) {
      const cur = mapped[i];
      const next = mapped[i + 1];
      const curTs = isNaN(new Date(cur.timestamp).getTime()) ? Date.now() : new Date(cur.timestamp).getTime();
      const nextTs = next && !isNaN(new Date(next.timestamp).getTime()) ? new Date(next.timestamp).getTime() : Date.now();
      const durationMs = Math.max(0, nextTs - curTs);
      cur.durationMs = durationMs;
      cur.durationHuman = formatDuration(durationMs);
    }

    return mapped;
  };

  // Prefer canonical server fields (assignedTo / assignedToName). Fallbacks kept.
  const resolveAssignedOfficer = (t: any, officersList: any[]) => {
    if (!t || !Array.isArray(officersList)) return null;

    // Candidate ids/names to try (prefer canonical)
    const idCandidates = [
      t.assignedTo,
      t.assignToOfficer,
      t.assignTo,
      t.assignedToId,
      t.assignToOfficerId,
      t.assignTo || t.assignToOfficer
    ].filter(Boolean);

    for (const assign of idCandidates) {
      const byId = officersList.find(o =>
        o.employeeId === assign || o.id === assign || String(o.id) === String(assign)
      );
      if (byId) return byId;
    }

    const nameCandidates = [
      t.assignedToName,
      t.assignedToName || t.officerName,
      t.officerName,
      t.assignToOfficerName
    ].filter(Boolean);

    for (const nm of nameCandidates) {
      const byName = officersList.find(o => ((o.fullName || o.name) || '').toLowerCase() === String(nm).toLowerCase());
      if (byName) return byName;
    }

    if (t.phoneNumber) {
      const cleaned = String(t.phoneNumber).replace(/\s|\+|-/g, '');
      const byPhone = officersList.find(o => String(o.phone || o.mobile || '').replace(/\s|\+|-/g, '') === cleaned);
      if (byPhone) return byPhone;
    }

    if (t.department || t.departmentName) {
      const dept = (t.department || t.departmentName).toLowerCase();
      const byDept = officersList.find(o => (o.department || '').toLowerCase() === dept);
      if (byDept) return byDept;
    }

    return null;
  };

  // --- helper to update tappal via PUT (returns parsed response if available) ---
  const updateTappalOnServer = async (fields: Record<string, any>) => {
    if (!tappal) throw new Error('No tappal loaded to update');

    const tappalIdentifier = tappal.tappalId || normalizeTappalId(tappal) || tappalId;
    if (!tappalIdentifier) throw new Error('Unable to determine tappal identifier for update');

    // Build payload: include only what's necessary, but ensure tappalId exists.
    const payload = {
      tappalId: tappalIdentifier,
      ...fields
    };

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

    // Return parsed JSON if backend returns updated object
    const json = await res.json().catch(() => ({}));
    return json;
  };

  // --- Load live data (including per-tappal movements) ---------------------
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [tappalRes, officerRes] = await Promise.all([
          fetch(TAPPAL_API).then(r => r.ok ? r.json() : Promise.reject(new Error('Tappal fetch failed'))),
          fetch(OFFICER_API).then(r => r.ok ? r.json() : Promise.reject(new Error('Officers fetch failed')))
        ]);

        const tappalList = Array.isArray(tappalRes) ? tappalRes : (tappalRes?.data || []);
        const officersList = officerRes?.officers || (Array.isArray(officerRes) ? officerRes : []);
        if (!mounted) return;

        const found = tappalList.find((t: any) => {
          const idA = normalizeTappalId(t) || t.tappalId || t.tappleId || '';
          return String(idA) === String(tappalId);
        }) || tappalList.find((t: any) => String(t.tappalId || t.tappleId || '').toLowerCase() === String(tappalId || '').toLowerCase());

        setTappal(found || null);
        setOfficers(Array.isArray(officersList) ? officersList : []);
        const assigned = found ? resolveAssignedOfficer(found, officersList) : null;
        setAssignedOfficer(assigned);

        // movements
        let movementsForThis: any[] = [];
        if (found && (found.tappalId || found.tappleId || found.tappalId === '')) {
          const idToUse = found.tappalId || found.tappleId || normalizeTappalId(found);
          try {
            const url = `${MOVEMENT_API_BY_TAPPAL_BASE}/${encodeURIComponent(String(idToUse))}/forward`;
            const mvRes = await fetch(url);
            if (mvRes.ok) {
              const mvJson = await mvRes.json();
              const mvArr = Array.isArray(mvJson) ? mvJson : (mvJson?.data || mvJson?.forwards || mvJson?.forwardsList || []);
              movementsForThis = buildMovementsForTappal(idToUse, mvArr);
            } else {
              console.warn('Per-tappal movement GET failed, falling back to bulk movements', mvRes.status);
              const bulk = await fetch(MOVEMENT_API_BULK).then(r => r.ok ? r.json() : []);
              movementsForThis = buildMovementsForTappal(found.tappalId || found.tappleId || normalizeTappalId(found), bulk);
            }
          } catch (err) {
            console.warn('Error fetching per-tappal movements, falling back to bulk', err);
            try {
              const bulk = await fetch(MOVEMENT_API_BULK).then(r => r.ok ? r.json() : []);
              movementsForThis = buildMovementsForTappal(found.tappalId || found.tappleId || normalizeTappalId(found), bulk);
            } catch (e) {
              movementsForThis = [];
            }
          }
        } else {
          movementsForThis = [];
        }

        if (!mounted) return;
        setMovements(movementsForThis);
      } catch (err: any) {
        console.error('Tappal load error', err);
        showToast({ type: 'error', title: 'Load error', message: err.message || 'Failed to load tappal data' });
        setTappal(null);
        setMovements([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [tappalId, showToast]);

  // --- keep original permission & action logic --------------------------------
  const canForward = useMemo(() => {
    if (!user || !tappal) return false;
    const allowed = ['co_officer','collector','joint_collector','dro','rdo','tahsildar','naib_tahsildar','ri','vro'];
    return allowed.includes(user.role) || user.id === (tappal.assignedTo || tappal.assignToOfficer || tappal.assignTo);
  }, [user, tappal]);

  const canChangeStatus = canForward;

  // action handlers
  const handleForward = async () => {
    if (!forwardForm.toOfficerId || !forwardForm.reason.trim()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Please select an officer and provide a reason for forwarding.' });
      return;
    }

    const toOfficer = officers.find(o => o.id === forwardForm.toOfficerId || o.employeeId === forwardForm.toOfficerId);
    if (!toOfficer) {
      showToast({ type: 'error', title: 'Forward failed', message: 'Selected officer not found.' });
      return;
    }

    const fromActor = assignedOfficer || user || {};
    const fromId = fromActor.employeeId || fromActor.id || user?.employeeId || user?.id || 'UNKNOWN';
    const fromName = fromActor.fullName || fromActor.name || user?.fullName || user?.name || 'Unknown';

    const movementPayload = {
      fromOfficerId: fromId,
      toOfficerId: toOfficer.employeeId || toOfficer.id || 'UNKNOWN',
      reason: forwardForm.reason,
      fromOfficerName: fromName,
      toOfficerName: toOfficer.fullName || toOfficer.name || 'Unknown',
      fromOfficerRole: fromActor.role || '',
      toOfficerRole: toOfficer.role || toOfficer.position || '',
      fromDepartment: fromActor.department || '',
      toDepartment: toOfficer.department || '',
      fromOfficerPhone: fromActor.phone || fromActor.phoneNumber || '',
      toOfficerPhone: toOfficer.phone || toOfficer.phoneNumber || '',
      status: 'Forwarded',
      timestamp: new Date().toISOString()
    };

    setForwardLoading(true);
    try {
      const tappalIdentifier = tappal.tappalId || normalizeTappalId(tappal) || tappalId;
      const postUrl = `${MOVEMENT_API_POST_BASE}/${encodeURIComponent(String(tappalIdentifier))}/forward`;

      // 1) Create movement record
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementPayload)
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText || 'POST failed');
        showToast({ type: 'error', title: 'Forward failed', message: `Server returned ${res.status}: ${errorText}` });
        setForwardLoading(false);
        return;
      }

      const created = await res.json();
      const createdMovementRaw = Array.isArray(created) ? created[0] : (created?.data || created || {});
      const newMovement = normalizeMovement(createdMovementRaw, movements.length + 1);

      // Append movement in UI
      setMovements(prev => {
        const next = [...prev, newMovement];
        next.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // recompute durations after adding
        for (let i = 0; i < next.length; i++) {
          const cur = next[i];
          const nextMv = next[i + 1];
          const curTs = isNaN(new Date(cur.timestamp).getTime()) ? Date.now() : new Date(cur.timestamp).getTime();
          const nextTs = nextMv && !isNaN(new Date(nextMv.timestamp).getTime()) ? new Date(nextMv.timestamp).getTime() : Date.now();
          const durationMs = Math.max(0, nextTs - curTs);
          cur.durationMs = durationMs;
          cur.durationHuman = formatDuration(durationMs);
        }

        return next;
      });

      // 2) Persist assignment using canonical backend fields (assignedTo / assignedToName)
      try {
        const putResult = await updateTappalOnServer({
          assignedTo: toOfficer.employeeId || toOfficer.id,
          assignedToName: toOfficer.fullName || toOfficer.name
        });

        // If PUT returns updated object, use it to update UI
        if (putResult && typeof putResult === 'object' && Object.keys(putResult).length > 0) {
          const latestTappal = Array.isArray(putResult) ? putResult[0] : (putResult?.data || putResult || {});
          setTappal(prev => ({ ...(prev || {}), ...latestTappal }));
          const resolved = resolveAssignedOfficer(latestTappal, officers);
          if (resolved) setAssignedOfficer(resolved);
          else setAssignedOfficer(toOfficer);
        } else {
          // fallback: optimistic local update and best-effort re-fetch
          setTappal(prev => ({ ...(prev || {}), assignedTo: toOfficer.employeeId || toOfficer.id, assignedToName: toOfficer.fullName || toOfficer.name }));
          setAssignedOfficer(toOfficer);

          // Attempt to GET authoritative tappal
          try {
            const getUrl = `${TAPPAL_API}/${encodeURIComponent(String(tappalIdentifier))}`;
            const getRes = await fetch(getUrl);
            if (getRes.ok) {
              const latest = await getRes.json();
              const latestTappal = Array.isArray(latest) ? latest[0] : (latest?.data || latest || {});
              setTappal(prev => ({ ...(prev || {}), ...latestTappal }));
              const resolved = resolveAssignedOfficer(latestTappal, officers);
              if (resolved) setAssignedOfficer(resolved);
            }
          } catch (e) {
            // ignore GET error — UI already optimistically updated
            console.warn('GET after PUT failed', e);
          }
        }

        showToast({ type: 'success', title: 'Tappal Forwarded', message: `${tappal?.tappalId} forwarded to ${toOfficer.fullName || toOfficer.name}` });
      } catch (err: any) {
        console.error('PUT assign failed', err);
        // Keep optimistic update so UI matches user action
        setTappal(prev => ({ ...(prev || {}), assignedTo: toOfficer.employeeId || toOfficer.id, assignedToName: toOfficer.fullName || toOfficer.name }));
        setAssignedOfficer(toOfficer);
        showToast({ type: 'warning', title: 'Partial Success', message: 'Movement saved but persisting assignment failed. UI updated optimistically.' });
      }

      // reset form & close
      setForwardForm({ toOfficerId: '', reason: '' });
      setShowForwardModal(false);
    } catch (err: any) {
      console.error('Forward error', err);
      showToast({ type: 'error', title: 'Forward failed', message: err.message || 'Network error while forwarding' });
    } finally {
      setForwardLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentForm.comment.trim()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Please enter a comment before submitting.' });
      return;
    }

    const newComment = {
      id: `COM-${Date.now()}`,
      userId: user?.id || 'unknown',
      userName: user?.fullName || user?.name || 'You',
      comment: commentForm.comment,
      timestamp: new Date().toISOString()
    };

    const newComments = [...(tappal?.comments || []), newComment];

    // optimistic UI update
    setTappal((prev: any) => ({ ...(prev || {}), comments: newComments }));
    setCommentForm({ comment: '' });
    setShowCommentModal(false);
    showToast({ type: 'info', title: 'Saving comment...', message: 'Updating server...' });

    try {
      await updateTappalOnServer({ comments: newComments });
      showToast({ type: 'success', title: 'Comment Added Successfully', message: `Your comment has been added to ${tappal?.tappalId}` });
    } catch (err: any) {
      console.error('Add comment failed', err);
      // roll back UI by removing the last comment if server fails
      setTappal((prev: any) => ({ ...(prev || {}), comments: (prev?.comments || []).filter((c: any) => c.id !== newComment.id) }));
      showToast({ type: 'error', title: 'Comment failed', message: err.message || 'Failed to save comment to server' });
    }
  };

  const handleStatusChange = async () => {
    if (!statusForm.newStatus || !statusForm.reason.trim()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Please select a new status and provide a reason for the change.' });
      return;
    }

    const statusChangeComment = {
      id: `COM-STATUS-${Date.now()}`,
      comment: `Status changed to "${statusForm.newStatus}". Reason: ${statusForm.reason}`,
      userId: user?.id || 'unknown',
      userName: user?.fullName || user?.name || 'You',
      timestamp: new Date().toISOString()
    };

    const newComments = [...(tappal?.comments || []), statusChangeComment];

    // optimistic UI update
    const prevTappal = tappal;
    setTappal((prev: any) => ({ ...(prev || {}), status: statusForm.newStatus, comments: newComments }));
    setShowStatusModal(false);
    showToast({ type: 'info', title: 'Updating status...', message: 'Saving to server...' });

    try {
      await updateTappalOnServer({ status: statusForm.newStatus, comments: newComments });
      showToast({ type: 'success', title: 'Status Updated Successfully', message: `${tappal?.tappalId} status has been changed to ${statusForm.newStatus}.` });
      setStatusForm({ newStatus: '', reason: '' });
    } catch (err: any) {
      console.error('Status update failed', err);
      // revert optimistic change
      setTappal(prev => ({ ...(prevTappal || {}) }));
      showToast({ type: 'error', title: 'Status update failed', message: err.message || 'Failed to update status on server' });
    }
  };

  const daysOverdue = getDaysOverdue(tappal?.expiryDate);
  const overdueStatus = isOverdue(tappal?.expiryDate, tappal?.status);

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      co_officer: 'Chief Officer',
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
    if (!role) return '';
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tappal details...</p>
        </div>
      </div>
    );
  }

  if (!tappal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tappal Not Found</h2>
          <p className="text-gray-600 mb-4">The requested tappal could not be found.</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // --- UI (kept same as your original) -------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tappal Details</h1>
                <p className="text-gray-600">{tappal.tappalId || normalizeTappalId(tappal)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button onClick={() => setShowCommentModal(true)} className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <MessageSquare className="h-4 w-4 mr-2" /> Add Comment
              </button>
              {canChangeStatus && (
                <button onClick={() => setShowStatusModal(true)} className="inline-flex items-center px-4 py-2 border border-green-300 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Edit className="h-4 w-4 mr-2" /> Change Status
                </button>
              )}
              {canForward && (
                <button onClick={() => setShowForwardModal(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" /> Forward Tappal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tappal Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{tappal.subject || 'No subject'}</h2>
                <p className="text-gray-600 mt-1">{tappal.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(tappal.confidential || tappal.isConfidential) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <EyeOff className="h-4 w-4 mr-1" /> Confidential
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tappal.status)}`}>{tappal.status || '—'}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(tappal.priority)}`}>{tappal.priority || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{tappal.department || tappal.departmentName || '—'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{formatDate(tappal.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{formatDate(tappal.expiryDate)}</p>
                  {overdueStatus && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />{daysOverdue} days overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Officer */}
        {assignedOfficer ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Assigned To</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">{(assignedOfficer.fullName || assignedOfficer.name || 'U').split(' ').map((n:any)=>n[0]).join('')}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{assignedOfficer.fullName || assignedOfficer.name}</h4>
                <p className="text-gray-600">{getRoleDisplayName(assignedOfficer.role)}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1"><Phone className="h-4 w-4" /><span>{assignedOfficer.phone || assignedOfficer.phoneNumber || '—'}</span></div>
                  <div className="flex items-center space-x-1"><Building className="h-4 w-4" /><span>{assignedOfficer.department || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Assigned To</h3>
            <div className="text-center py-6 text-gray-600">No officer assigned to this tappal yet.</div>
          </div>
        )}

        {/* Movement History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Movement History</h3>
          {movements.length === 0 ? (
            <div className="text-center py-8"><MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No movement history available</p></div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
              <div className="space-y-8">
                {movements.map((movement, index) => (
                  <div key={movement.id} className="relative flex items-start space-x-6">
                    <div className="relative z-10">
                      <div className={`w-4 h-4 rounded-full border-2 ${movement.status === 'Processed' ? 'bg-green-500 border-green-500' : movement.status === 'Received' ? 'bg-blue-500 border-blue-500' : 'bg-yellow-500 border-yellow-500'}`}></div>
                      {index < movements.length - 1 && (<ArrowRight className="absolute -right-2 top-6 h-4 w-4 text-gray-400" />)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${movement.status === 'Processed' ? 'bg-green-100 text-green-800' : movement.status === 'Received' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{movement.status}</span>
                              <span className="text-sm text-gray-500">{formatDateTime(movement.timestamp)}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">FROM</p>
                                <div className="flex items-center space-x-2"><User className="h-4 w-4 text-gray-400" /><div><p className="font-medium text-gray-900">{movement.fromOfficerName}</p><p className="text-sm text-gray-600">{getRoleDisplayName(movement.fromOfficerRole)}</p><p className="text-xs text-gray-500">{movement.fromOfficerPhone || '—'}</p></div></div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">TO</p>
                                <div className="flex items-center space-x-2"><User className="h-4 w-4 text-gray-400" /><div><p className="font-medium text-gray-900">{movement.toOfficerName}</p><p className="text-sm text-gray-600">{getRoleDisplayName(movement.toOfficerRole)}</p><p className="text-xs text-gray-500">{movement.toOfficerPhone || '—'}</p></div></div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">FORWARDING REASON</p>
                              <p className="text-sm text-gray-700">{movement.reason || '—'}</p>

                              {/* duration held until next forward */}
                              {movement.durationHuman && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Time with {movement.toOfficerName || 'officer'}: <span className="font-medium text-gray-700" title={`${movement.durationMs || 0} ms`}>{movement.durationHuman}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="relative flex items-start space-x-6">
                  <div className="relative z-10"><div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-blue-600 animate-pulse"></div></div>
                  <div className="flex-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-blue-600" /><span className="font-medium text-blue-900">Current Position</span></div>
                      <p className="text-blue-700 mt-1">Currently with {assignedOfficer?.fullName || assignedOfficer?.name || 'Not assigned'} ({getRoleDisplayName(assignedOfficer?.role || '') || '—'})</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2"><MessageSquare className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">Comments & Remarks</h2><span className="text-sm text-gray-500">({(tappal.comments || []).length})</span></div>
            <button onClick={() => setShowCommentModal(true)} className="inline-flex items-center px-3 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm"><Plus className="h-4 w-4 mr-1" />Add Comment</button>
          </div>

          {(tappal.comments || []).length === 0 ? (
            <div className="text-center py-8"><MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3><p className="text-gray-500">Be the first to add a comment or remark on this tappal.</p></div>
          ) : (
            <div className="space-y-4">
              {(tappal.comments || []).map((comment:any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-blue-600 font-medium text-sm">{(comment.userName||'U').split(' ').map((n:any)=>n[0]).join('')}</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{comment.userName}</h4>
                          <p className="text-xs text-gray-500">{formatDateTime(comment.timestamp)}</p>
                        </div>
                        {comment.userId === user?.id && (<span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Your Comment</span>)}
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        {(tappal.attachments || []).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tappal.attachments || []).map((attachment:any, idx:number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"><Eye className="h-3 w-3 mr-1" />View</button>
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"><Download className="h-3 w-3 mr-1" />Download</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals (Status / Comment / Forward) - unchanged UI logic */}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Change Tappal Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2"><Edit className="h-5 w-5 text-blue-600" /><span className="font-medium text-blue-900">Changing status for:</span></div>
                <p className="text-blue-800 font-medium">{tappal.tappalId} - {tappal.subject}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-blue-700 text-sm">Current Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>{tappal.status}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status *</label>
                <select value={statusForm.newStatus} onChange={(e) => setStatusForm(prev => ({ ...prev, newStatus: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select new status...</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Status Change *</label>
                <textarea value={statusForm.reason} onChange={(e) => setStatusForm(prev => ({ ...prev, reason: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter the reason for changing the status..." />
                <p className="text-xs text-gray-500 mt-1">This reason will be recorded in the audit trail and relevant officers will be notified.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2"><AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium">Important:</p><ul className="mt-1 space-y-1"><li>• Status changes are permanent and will be recorded in the audit trail</li><li>• All relevant officers will be notified about this status change</li><li>• If marking as 'Completed', ensure all work is actually finished</li><li>• This action cannot be undone without proper authorization</li></ul></div></div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleStatusChange} disabled={!statusForm.newStatus || !statusForm.reason.trim()} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"><Save className="h-4 w-4" /><span>Update Status</span></button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Comment</h2>
                <button onClick={() => setShowCommentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4"><div className="flex items-center space-x-2 mb-2"><MessageSquare className="h-5 w-5 text-blue-600" /><span className="font-medium text-blue-900">Adding comment to:</span></div><p className="text-blue-800 font-medium">{tappal.tappalId} - {tappal.subject}</p><p className="text-blue-700 text-sm mt-1">The assigned officer ({assignedOfficer?.fullName || assignedOfficer?.name}) will be notified about your comment.</p></div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment *</label>
                <textarea value={commentForm.comment} onChange={(e) => setCommentForm(prev => ({ ...prev, comment: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your comment or remark about this tappal..." />
                <p className="text-xs text-gray-500 mt-1">Your name and timestamp will be automatically added to the comment.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"><div className="flex items-start space-x-2"><AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium">Note:</p><p>Comments are visible to all officers who have access to this tappal. The assigned officer will receive a notification about your comment.</p></div></div></div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button onClick={() => setShowCommentModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddComment} disabled={!commentForm.comment.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"><MessageSquare className="h-4 w-4" /><span>Add Comment</span></button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Forward Tappal</h2>
                <button onClick={() => setShowForwardModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forward to Officer *</label>
                <select value={forwardForm.toOfficerId} onChange={(e) => setForwardForm(prev => ({ ...prev, toOfficerId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Officer</option>
                  {officers.filter(o => o.id !== user?.id).map(officer => (
                    <option key={officer.id} value={officer.id}>{officer.fullName || officer.name} - {officer.role || officer.position || ''} ({officer.department || ''})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Forwarding *</label>
                <textarea value={forwardForm.reason} onChange={(e) => setForwardForm(prev => ({ ...prev, reason: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter reason for forwarding this tappal..." />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button onClick={() => setShowForwardModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleForward} disabled={!forwardForm.toOfficerId || !forwardForm.reason.trim() || forwardLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>{forwardLoading ? 'Forwarding...' : 'Forward Tappal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TappalDetail;
