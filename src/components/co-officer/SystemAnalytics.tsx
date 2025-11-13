// src/components/co-officer/SystemAnalytics.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';
import { isTappalOverdue, formatDate } from '../../utils/dateUtils';

const TAPPAL_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';

type OfficerFromApi = {
  department?: string;
  role?: string;
  updatedAt?: string;
  email?: string;
  id: string;
  name?: string;
  phone?: string;
};

type TappalFromApi = {
  id?: string;
  tappalId?: string;
  subject?: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  department?: string;
  departmentName?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
  expiryDate?: string;
  petitionId?: string;
  isConfidential?: boolean;
  createdBy?: string;
  lastUpdated?: string;
  comments?: any[];
  attachments?: any[];
};

const SystemAnalytics: React.FC = () => {
  const [filters, setFilters] = useState({
    department: '',
    dateRange: { from: '', to: '' },
    officer: ''
  });

  const [officers, setOfficers] = useState<OfficerFromApi[]>([]);
  const [tappals, setTappals] = useState<TappalFromApi[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetch and normalize data
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [offRes, tapRes] = await Promise.all([
          fetch(OFFICER_API, { signal }),
          fetch(TAPPAL_API, { signal })
        ]);

        if (!offRes.ok) throw new Error(`Officer API error: ${offRes.status}`);
        if (!tapRes.ok) throw new Error(`Tappal API error: ${tapRes.status}`);

        const offJson = await offRes.json();
        const tapJson = await tapRes.json();

        // normalize officers
        let fetchedOfficers: OfficerFromApi[] = [];
        if (Array.isArray(offJson)) {
          fetchedOfficers = offJson as OfficerFromApi[];
        } else if (Array.isArray(offJson?.officers)) {
          fetchedOfficers = offJson.officers as OfficerFromApi[];
        } else if (Array.isArray(offJson?.data)) {
          fetchedOfficers = offJson.data as OfficerFromApi[];
        } else if (offJson && typeof offJson === 'object' && offJson.id) {
          fetchedOfficers = [offJson as OfficerFromApi];
        } else {
          fetchedOfficers = [];
        }
        setOfficers(fetchedOfficers);

        // normalize tappals
        let fetchedTappals: TappalFromApi[] = [];
        if (Array.isArray(tapJson)) {
          fetchedTappals = tapJson as TappalFromApi[];
        } else if (Array.isArray(tapJson?.tappals)) {
          fetchedTappals = tapJson.tappals as TappalFromApi[];
        } else if (Array.isArray(tapJson?.data)) {
          fetchedTappals = tapJson.data as TappalFromApi[];
        } else {
          fetchedTappals = [];
        }
        setTappals(fetchedTappals);

        // derive departments from tappals and officers (unique)
        const deptMap = new Map<string, string>();
        fetchedTappals.forEach(t => {
          const id = (t.department || '').toString().trim();
          const name = (t.departmentName || t.department || '').toString().trim();
          if (id) deptMap.set(id, name || id);
        });

        fetchedOfficers.forEach(o => {
          const id = (o.department || '').toString().trim();
          if (id && !deptMap.has(id)) deptMap.set(id, id);
        });

        const derivedDepartments = Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
        setDepartments(derivedDepartments);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('fetch error', err);
          setError(err.message || 'Failed to fetch data');
          setOfficers([]);
          setTappals([]);
          setDepartments([]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  // defensive helpers
  const getRoleDisplayName = (role?: string) => {
    const key = (role || '').toLowerCase();
    const roleNames: Record<string, string> = {
      collector: 'District Collector',
      joint_collector: 'Joint Collector',
      dro: 'District Revenue Officer',
      rdo: 'Revenue Divisional Officer',
      tahsildar: 'Tahsildar',
      naib_tahsildar: 'Naib Tahsildar',
      ri: 'Revenue Inspector',
      'revenue inspector': 'Revenue Inspector',
      'village revenue officer': 'Village Revenue Officer',
      vro: 'Village Revenue Officer',
      clerk: 'Clerk'
    };
    return roleNames[key] || role || 'Officer';
  };

  // filtered tappals
  const filteredTappals = useMemo(() => {
    return (tappals || []).filter(tappal => {
      const matchesDepartment = !filters.department || (tappal.department || '').toString() === filters.department;
      const matchesOfficer = !filters.officer || (tappal.assignedTo || '').toString() === filters.officer;
      const created = tappal.createdAt ? new Date(tappal.createdAt) : null;
      const fromOK = !filters.dateRange.from || (created && created >= new Date(filters.dateRange.from));
      const toOK = !filters.dateRange.to || (created && created <= new Date(filters.dateRange.to));
      return matchesDepartment && matchesOfficer && fromOK && toOK;
    });
  }, [tappals, filters]);

  // system stats
  const systemStats = useMemo(() => {
    const total = filteredTappals.length;
    const completed = filteredTappals.filter(t => ((t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'closed')).length;
    const pending = filteredTappals.filter(t => ((t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'active')).length;
    const inProgress = filteredTappals.filter(t => ((t.status || '').toLowerCase() === 'in progress' || (t.status || '').toLowerCase() === 'under review' || (t.status || '').toLowerCase() === 'in_progress')).length;
    const overdue = filteredTappals.filter(t => isTappalOverdue(t.expiryDate || '', t.status || '')).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, inProgress, overdue, completionRate };
  }, [filteredTappals]);

  // department stats derived from filteredTappals & departments
  const departmentStats = useMemo(() => {
    const stats: Record<string, any> = {};
    const depts = departments.length > 0 ? departments : [{ id: '', name: 'Unknown' }];

    depts.forEach(dept => {
      const deptTappals = filteredTappals.filter(t => (t.department || '').toString() === dept.id);
      stats[dept.id || dept.name] = {
        id: dept.id || dept.name,
        name: dept.name,
        total: deptTappals.length,
        completed: deptTappals.filter(t => (t.status || '').toLowerCase() === 'completed').length,
        pending: deptTappals.filter(t => (t.status || '').toLowerCase() === 'pending').length,
        inProgress: deptTappals.filter(t => (t.status || '').toLowerCase() === 'in progress').length,
        overdue: deptTappals.filter(t => isTappalOverdue(t.expiryDate || '', t.status || '')).length
      };
    });

    return Object.values(stats).filter((d: any) => d.total > 0);
  }, [filteredTappals, departments]);

  // officer performance
  const officerPerformance = useMemo(() => {
    const performance: any[] = [];
    const validOfficers = Array.isArray(officers) ? officers.filter(o => (o.id)) : [];

    validOfficers.forEach(officer => {
      const officerTappals = filteredTappals.filter(t => (t.assignedTo || '').toString() === officer.id.toString());
      const completed = officerTappals.filter(t => (t.status || '').toLowerCase() === 'completed').length;
      const overdue = officerTappals.filter(t => isTappalOverdue(t.expiryDate || '', t.status || '')).length;
      if (officerTappals.length > 0) {
        performance.push({
          officer: officer.name || officer.id,
          role: officer.role || '',
          department: officer.department || '',
          total: officerTappals.length,
          completed,
          overdue,
          completionRate: Math.round((completed / officerTappals.length) * 100)
        });
      }
    });

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }, [officers, filteredTappals]);

  // monthly trends (last 6 months)
  const monthlyTrends = useMemo(() => {
    const trends: { month: string; created: number; completed: number; overdue: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString(undefined, { month: 'short' });
      const monthTappals = filteredTappals.filter(t => {
        if (!t.createdAt) return false;
        const created = new Date(t.createdAt);
        return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
      });
      const created = monthTappals.length;
      const completed = monthTappals.filter(t => (t.status || '').toLowerCase() === 'completed').length;
      const overdue = monthTappals.filter(t => isTappalOverdue(t.expiryDate || '', t.status || '')).length;
      trends.push({ month: monthLabel, created, completed, overdue });
    }
    return trends;
  }, [filteredTappals]);

  const maxDeptValue = Math.max(...departmentStats.map((d: any) => d.total), 1);
  const maxMonthlyValue = Math.max(...monthlyTrends.map(m => Math.max(m.created, m.completed, m.overdue)), 1);

  if (loading) return <div className="p-6">Loading system analytics...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading data: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">System Analytics</h1>
        <p className="text-gray-600">Comprehensive analytics and performance insights across the entire system</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Officer</label>
            <select
              value={filters.officer}
              onChange={(e) => setFilters(prev => ({ ...prev, officer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Officers</option>
              {officers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateRange.from}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, from: e.target.value } }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateRange.to}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, to: e.target.value } }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{systemStats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{systemStats.inProgress}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{systemStats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{systemStats.overdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Department Performance</h2>
          </div>
          <div className="space-y-4">
            {departmentStats.map((dept: any, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <span className="text-sm text-gray-500">{dept.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(dept.total / maxDeptValue) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Completed: {dept.completed}</span>
                  <span>Overdue: {dept.overdue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Monthly Trends</h2>
          </div>
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{month.month} 2025</span>
                  <span className="text-sm text-gray-500">Total: {month.created + month.completed + month.overdue}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                  <div className="bg-blue-500 h-4 absolute left-0 top-0" style={{ width: `${(month.created / maxMonthlyValue) * 100}%` }} />
                  <div className="bg-green-500 h-4 absolute top-0" style={{ left: `${(month.created / maxMonthlyValue) * 100}%`, width: `${(month.completed / maxMonthlyValue) * 100}%` }} />
                  <div className="bg-red-500 h-4 absolute top-0" style={{ left: `${((month.created + month.completed) / maxMonthlyValue) * 100}%`, width: `${(month.overdue / maxMonthlyValue) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {month.created}</span>
                  <span>Completed: {month.completed}</span>
                  <span>Overdue: {month.overdue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Officer Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Officers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officerPerformance.slice(0, 10).map((officer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-xs">{String(officer.officer || '').split(' ').map((n: string) => n[0]).join('')}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{officer.officer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{getRoleDisplayName(officer.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{officer.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{officer.completed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{officer.overdue}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${officer.completionRate >= 80 ? 'text-green-600' : officer.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{officer.completionRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${officer.completionRate >= 80 ? 'bg-green-500' : officer.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${officer.completionRate}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{systemStats.completionRate}%</div>
            <p className="text-gray-600">Overall System Completion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{officers.length}</div>
            <p className="text-gray-600">Active Officers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">{departments.length}</div>
            <p className="text-gray-600">Active Departments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;
