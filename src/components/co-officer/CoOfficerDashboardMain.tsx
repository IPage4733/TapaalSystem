import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Building,
  BarChart3,
  UserPlus,
  ScrollText,
  Plus,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Shield
} from 'lucide-react';
import { isOverdue } from '../../utils/dateUtils';

// API endpoints (provided)
const TAPPAL_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const DEPARTMENTS_API = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';

// Basic types (adjust as needed)
type Tappal = {
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
  expiryDate?: string; // ISO date or yyyy-mm-dd
  petitionId?: string;
  isConfidential?: boolean;
  comments?: any[];
  attachments?: string[];
};

type Officer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
};

type Department = {
  id: string;
  departmentName: string;
  departmentCode?: string;
  district?: string;
  state?: string;
};

const CoOfficerDashboardMain: React.FC = () => {
  const navigate = useNavigate();

  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all endpoints in parallel
        const [tResp, oResp, dResp] = await Promise.all([
          fetch(TAPPAL_API, { signal: controller.signal }),
          fetch(OFFICER_API, { signal: controller.signal }),
          fetch(DEPARTMENTS_API, { signal: controller.signal })
        ]);

        if (!tResp.ok) throw new Error(`Tappal API error: ${tResp.status}`);
        if (!oResp.ok) throw new Error(`Officer API error: ${oResp.status}`);
        if (!dResp.ok) throw new Error(`Departments API error: ${dResp.status}`);

        const tData = await tResp.json();
        const oData = await oResp.json();
        const dData = await dResp.json();

        // TAPPAL API - many APIs return array directly. If your API wraps it, adapt here.
        const tappalList: Tappal[] = Array.isArray(tData) ? tData : (tData.items || tData.tappals || []);

        // OFFICER API - sample payload shows { success, count, officers }
        const officerList: Officer[] = Array.isArray(oData)
          ? oData
          : (oData.officers || []);

        // DEPARTMENTS API returns array in provided sample
        const departmentList: Department[] = Array.isArray(dData) ? dData : (dData.departments || []);

        if (mounted) {
          setTappals(tappalList as Tappal[]);
          setOfficers(
            (officerList as Officer[]).map((o: any) => ({
              id: o.id || o.employeeId || o.empId || o.ID || o.employee || '',
              name: o.name || o.employeeName || o.fullName || '',
              email: o.email,
              phone: o.phone,
              department: o.department,
              role: o.role
            }))
          );
          setDepartments(
            (departmentList as Department[]).map((d: any) => ({
              id: d.id,
              departmentName: d.departmentName || d.name || d.department || '',
              departmentCode: d.departmentCode,
              district: d.district,
              state: d.state
            }))
          );
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          if (err.name === 'AbortError') return;
          setError(err.message || 'Failed to load data');
          setLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Calculate system-wide stats
  const systemStats = useMemo(() => {
    const totalOfficers = officers.length;
    const totalTappals = tappals.length;
    const totalDepartments = departments.length;
    const overdueTappals = tappals.filter(t => isOverdue(t.expiryDate || '', t.status || '')).length;
    const completedTappals = tappals.filter(t => (t.status || '').toLowerCase() === 'completed').length;
    const pendingTappals = tappals.filter(t => (t.status || '').toLowerCase() === 'pending').length;

    return {
      totalOfficers,
      totalTappals,
      totalDepartments,
      overdueTappals,
      completedTappals,
      pendingTappals,
      completionRate: totalTappals > 0 ? Math.round((completedTappals / totalTappals) * 100) : 0
    };
  }, [tappals, officers, departments]);

  // Get role distribution
  const roleDistribution = useMemo(() => {
    const roles = officers.reduce((acc: Record<string, number>, user) => {
      const roleKey = (user.role || 'Unknown').toString();
      acc[roleKey] = (acc[roleKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(roles).map(([role, count]) => ({
      role: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));
  }, [officers]);

  const quickActions = [
    {
      title: 'Track Petitions',
      description: 'Monitor citizen petitions',
      icon: ScrollText,
      path: '/co-officer-dashboard/petitions',
      color: 'emerald'
    },
    {
      title: 'Create Tappal',
      description: 'Create tappal from petition',
      icon: Plus,
      path: '/co-officer-dashboard/create-tappal',
      color: 'blue',
      primary: true
    },
    {
      title: 'Manage Officers',
      description: 'View and manage all officers',
      icon: Users,
      path: '/co-officer-dashboard/officers',
      color: 'blue',
      count: systemStats.totalOfficers
    },
    {
      title: 'Create Officer',
      description: 'Add new officer to system',
      icon: UserPlus,
      path: '/co-officer-dashboard/create-officer',
      color: 'green',
      primary: true
    },
    {
      title: 'Manage Assignments',
      description: 'Assign tappals to officers',
      icon: FileText,
      path: '/co-officer-dashboard/assignments',
      color: 'orange'
    },
    {
      title: 'System Analytics',
      description: 'View system-wide analytics',
      icon: BarChart3,
      path: '/co-officer-dashboard/analytics',
      color: 'purple'
    },
    {
      title: 'Performance Reports',
      description: 'Officer performance analysis',
      icon: Award,
      path: '/co-officer-dashboard/performance',
      color: 'indigo'
    },
    {
      title: 'Manage Departments',
      description: 'Department administration',
      icon: Building,
      path: '/co-officer-dashboard/departments',
      color: 'teal'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">Loading dashboard data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-700">Failed to load data</h3>
          <p className="text-sm text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Co-Officer Dashboard</h1>
        <p className="text-gray-600">Administrative control and system management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Officers</p>
              <p className="text-2xl font-bold text-purple-600">{systemStats.totalOfficers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tappals</p>
              <p className="text-2xl font-bold text-blue-600">{systemStats.totalTappals}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-teal-600">{systemStats.totalDepartments}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-full">
              <Building className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">{systemStats.completionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{systemStats.completedTappals}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{systemStats.pendingTappals}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{systemStats.overdueTappals}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon as any;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left group flex items-center justify-between ${
                    action.primary
                      ? 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      action.primary
                        ? 'bg-purple-200 group-hover:bg-purple-300'
                        : `bg-${action.color}-100 group-hover:bg-${action.color}-200`
                    } transition-colors`}>
                      <Icon className={`h-5 w-5 ${
                        action.primary
                          ? 'text-purple-700'
                          : `text-${action.color}-600`
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                  {action.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${action.color}-100 text-${action.color}-700`}>
                      {action.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Officer Distribution</h2>
            <button
              onClick={() => navigate('/co-officer-dashboard/officers')}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {roleDistribution.map((role, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">{role.role}</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{role.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {systemStats.completionRate}%
            </div>
            <p className="text-gray-600">Overall Completion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {systemStats.totalOfficers}
            </div>
            <p className="text-gray-600">Active Officers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {systemStats.totalDepartments}
            </div>
            <p className="text-gray-600">Active Departments</p>
          </div>
        </div>
      </div>

      {/* Administrative Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-purple-800 mb-2">Administrative Authority</h3>
            <div className="text-purple-700 space-y-1">
              <p>• <strong>Officer Management:</strong> Create, edit, and manage all system officers</p>
              <p>• <strong>Assignment Control:</strong> Assign and reassign tappals to appropriate officers</p>
              <p>• <strong>Department Administration:</strong> Manage departments and organizational structure</p>
              <p>• <strong>System Analytics:</strong> Access comprehensive performance and usage analytics</p>
              <p>• <strong>Performance Monitoring:</strong> Track officer performance and system efficiency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoOfficerDashboardMain;
