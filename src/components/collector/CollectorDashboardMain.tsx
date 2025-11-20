import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { 
  FileText, 
  Clock, 
  Users, 
  Building, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  User
} from 'lucide-react';
import { mockTappals, mockDepartments } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { formatDate, isOverdue } from '../../utils/dateUtils';

const TAPPALS_API = "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";
const OFFICER_API = "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer"; // new: employees source
const API_KEY = ""; // optional: set if your API Gateway requires x-api-key

const CollectorDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // data state (start with mocks while loading)
  const [tappals, setTappals] = useState<any[]>(mockTappals);
  const [officersCount, setOfficersCount] = useState<number | null>(null); // <-- use this for Total Employees
  const [loading, setLoading] = useState(true);

  // ---- small helpers for visuals ----
  const statusClass = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    const s = String(status).toLowerCase();

    if (s.includes('forward')) return 'bg-gray-100 text-gray-700';      // FORWARDED / neutral
    if (s.includes('active'))   return 'bg-blue-100 text-blue-600';     // Active / In Progress
    if (s.includes('progress')) return 'bg-blue-100 text-blue-600';
    if (s.includes('review'))   return 'bg-yellow-100 text-yellow-600'; // Under Review
    if (s.includes('completed'))return 'bg-green-100 text-green-600';   // Completed
    if (s.includes('pending'))  return 'bg-gray-100 text-gray-700';     // Pending (neutral)
    if (s.includes('rejected')) return 'bg-red-100 text-red-600';       // Rejected
    if (s.includes('urgent'))   return 'bg-red-100 text-red-600';       // Urgent
    return 'bg-gray-100 text-gray-700';
  };

  const colorBgClass = (color?: string) => {
    switch (color) {
      case 'blue':   return { bg: 'bg-blue-100', icon: 'text-blue-600', hoverBg: 'group-hover:bg-blue-200' };
      case 'purple': return { bg: 'bg-purple-100', icon: 'text-purple-600', hoverBg: 'group-hover:bg-purple-200' };
      case 'green':  return { bg: 'bg-green-100', icon: 'text-green-600', hoverBg: 'group-hover:bg-green-200' };
      case 'orange': return { bg: 'bg-orange-100', icon: 'text-orange-600', hoverBg: 'group-hover:bg-orange-200' };
      case 'red':    return { bg: 'bg-red-100', icon: 'text-red-600', hoverBg: 'group-hover:bg-red-200' };
      case 'teal':   return { bg: 'bg-teal-100', icon: 'text-teal-600', hoverBg: 'group-hover:bg-teal-200' };
      case 'pink':   return { bg: 'bg-pink-100', icon: 'text-pink-600', hoverBg: 'group-hover:bg-pink-200' };
      case 'indigo': return { bg: 'bg-indigo-100', icon: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-200' };
      default:       return { bg: 'bg-gray-100', icon: 'text-gray-700', hoverBg: 'group-hover:bg-gray-200' };
    }
  };
  // ------------------------------------

  // helper fetch wrapper (handles optional auth and x-api-key)
  const doFetch = async (url: string, opts: RequestInit = {}) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any || {}) };
    if (API_KEY) headers['x-api-key'] = API_KEY;
    try {
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) { /* ignore */ }

    const res = await fetch(url, { ...opts, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err: any = new Error(`HTTP ${res.status}: ${text}`);
      err.status = res.status;
      throw err;
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  };

  // fetch tappals AND officers count
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      try {
        // 1) tappals
        try {
          const resp = await doFetch(TAPPALS_API, { method: 'GET', signal: controller.signal } as any);
          const items = resp?.data ?? (Array.isArray(resp) ? resp : []);
          if (mounted && Array.isArray(items) && items.length > 0) {
            setTappals(items);
          } else if (mounted && Array.isArray(items) && items.length === 0) {
            console.warn('Tappals API returned empty array — using mock data as fallback.');
          } else if (mounted) {
            console.warn('Tappals API returned unexpected shape — using mock data as fallback.', resp);
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('Failed to load tappals', err);
            showToast && showToast('Failed to load tappals', { type: 'error' });
          }
        }

        // 2) officers count (this is the change you requested)
        try {
          const offResp = await doFetch(OFFICER_API, { method: 'GET', signal: controller.signal } as any);
          // possible shapes:
          // { success:true, count:9, officers: [...] }
          // { officers: [...] }
          // [ ... ] (array)
          if (offResp && typeof offResp === 'object') {
            if (typeof offResp.count === 'number') {
              if (mounted) setOfficersCount(offResp.count);
            } else if (Array.isArray(offResp.officers)) {
              if (mounted) setOfficersCount(offResp.officers.length);
            } else if (Array.isArray(offResp)) {
              if (mounted) setOfficersCount(offResp.length);
            } else {
              // unexpected shape -> fallback to derive from tappals later
              console.warn('Officer API returned unexpected shape, will fallback to derive employee count from tappals.', offResp);
            }
          } else if (Array.isArray(offResp)) {
            if (mounted) setOfficersCount(offResp.length);
          } else {
            console.warn('Officer API returned non-json response, falling back to tappals derived count.');
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('Failed to fetch officers — will derive employees from tappals.', err.message ?? err);
          }
        }

      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived stats (from tappals only)
  const totalTappals = tappals.length;
  const overdueTappals = tappals.filter(t => isOverdue(t.expiryDate, t.status)).length;

  // If officersCount was fetched use it, otherwise derive unique assignedToName from tappals
  const totalEmployees = useMemo(() => {
    if (typeof officersCount === 'number') return officersCount;
    const setNames = new Set<string>();
    tappals.forEach(t => {
      const name = (t.assignedToName ?? t.assignedTo ?? '').toString().trim();
      if (name) setNames.add(name);
    });
    return setNames.size;
  }, [tappals, officersCount]);

  const totalDepartments = useMemo(() => {
    const setDepts = new Set<string>();
    tappals.forEach(t => {
      const dept = (t.departmentName && String(t.departmentName).trim())
        ? t.departmentName
        : (typeof t.department === 'string' ? t.department : (t.department?.name ?? '').toString());
      if (dept) setDepts.add(dept);
    });
    return setDepts.size;
  }, [tappals]);

  const completedTappals = tappals.filter(t => (t.status ?? '').toString().toLowerCase() === 'completed').length;
  const pendingTappals = tappals.filter(t => (t.status ?? '').toString().toLowerCase() === 'pending').length;

  const recentTappals = useMemo(() => {
    return [...tappals]
      .sort((a, b) => new Date(b.createdAt || b.lastUpdated || 0).getTime() - new Date(a.createdAt || a.lastUpdated || 0).getTime())
      .slice(0, 5);
  }, [tappals]);

  const quickLinks = [
    { title: 'Track Petitions', description: 'Monitor citizen petitions', path: '/collector-dashboard/petitions', icon: FileText, color: 'blue' },
    { title: 'All Tappals', description: 'View generated tappals', path: '/collector-dashboard/tappals', icon: FileText, color: 'purple' },
    { title: 'Global Search', description: 'Search across all records', path: '/collector-dashboard/search', icon: FileText, color: 'indigo' },
    { title: 'Department Analytics', description: 'Department-wise performance', path: '/collector-dashboard/department-analytics', icon: TrendingUp, color: 'green' },
    { title: 'Employee Performance', description: 'Track employee metrics', path: '/collector-dashboard/employee-performance', icon: Users, color: 'orange' },
    { title: 'Overdue Tappals', description: 'Manage overdue items', path: '/collector-dashboard/overdue', icon: Clock, color: 'red' },
    { title: 'Manage Departments', description: 'Department administration', path: '/collector-dashboard/departments', icon: Building, color: 'teal' },
    { title: 'User Management', description: 'Manage system users', path: '/collector-dashboard/users', icon: Users, color: 'pink' }
  ];

  const handleTappalClick = (tappalId?: string) => {
    if (!tappalId) return;
    navigate(`/tappal/${tappalId}`);
  };

  // UI identical to your original markup, with statusClass & colored icons applied
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Collector Dashboard</h1>
            <p className="text-gray-600">Welcome to the District Collectorate File Tracking System</p>
          </div>
          <button
            onClick={() => navigate('/collector-dashboard/create-tappal')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <FileText className="h-5 w-5 mr-2" />
            Create New Tappal
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-gray-900">{totalTappals}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappals}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{officersCount !== null ? officersCount : totalEmployees}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{totalDepartments}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/collector-dashboard/tappals?status=Completed')}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTappals}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view all completed</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/collector-dashboard/tappals?status=Pending')}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingTappals}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view all pending</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/collector-dashboard/overdue')}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueTappals}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view all overdue</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tappals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tappals</h2>
            <button
              onClick={() => navigate('/collector-dashboard/tappals')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentTappals.map((tappal) => (
              <div
                key={tappal.tappalId ?? tappal.id ?? tappal._id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleTappalClick(tappal.tappalId ?? tappal.id ?? tappal._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{tappal.tappalId}</p>
                    <p className="text-gray-600 text-sm truncate">{tappal.subject}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{tappal.assignedToName || '-'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatDate(tappal.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(tappal.status)}`}>
                    {tappal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              const c = colorBgClass(link.color);
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left group`}
                >
                  <div className={`p-2 ${c.bg} rounded-lg w-fit mb-2 ${c.hoverBg} transition-colors`}>
                    <Icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboardMain;
