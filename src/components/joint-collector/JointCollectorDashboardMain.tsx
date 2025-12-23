import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Users,
  AlertTriangle,
  Calendar,
  User,
  Building,
  BarChart3,
  ScrollText,
  Send,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isOverdue, getStatusColor } from '../../utils/dateUtils';

const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const TAPPAL_API  = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';

const ROLES_UNDER_JC = [
  'dro','DRO','rdo','RDO','tahsildar','Tahsildar',
  'tashildhar','Revenue Inspector','REVENUE INSPECTOR',
  'Village Revenue Officer','officer','Officer',
  'co-officer','Co-Officer'
];

const JointCollectorDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [officers, setOfficers] = useState<any[]>([]);
  const [tappals, setTappals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] =
    useState<'assigned-to-jc' | 'assigned-to-officers'>('assigned-to-jc');

  /* ================= FETCH OFFICERS ================= */
  useEffect(() => {
    const fetchOfficers = async () => {
      const res = await fetch(OFFICER_API);
      const json = await res.json();
      const jcOfficers = (json.officers || []).filter((o: any) =>
        ROLES_UNDER_JC.includes(o.role)
      );
      setOfficers(jcOfficers);
    };
    fetchOfficers();
  }, []);

  /* ================= FETCH TAPPALS ================= */
  useEffect(() => {
    const fetchTappals = async () => {
      try {
        const res = await fetch(TAPPAL_API);
        const data = await res.json();
        setTappals(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTappals();
  }, []);

  /* ================= DATA ================= */
  const officerIds = useMemo(() => officers.map(o => o.id), [officers]);

  const tappalsAssignedToJC = useMemo(
    () => tappals.filter((t: any) => t.assignedTo === user?.id),
    [tappals, user]
  );

  const tappalsUnderJC = useMemo(
    () => tappals.filter((t: any) => officerIds.includes(t.assignedTo)),
    [tappals, officerIds]
  );

  const totalTappalsUnderJC = [...tappalsAssignedToJC, ...tappalsUnderJC];

  const overdueCount = totalTappalsUnderJC.filter((t: any) =>
    isOverdue(t.expiryDate, t.status)
  ).length;

  const displayTappals =
    viewMode === 'assigned-to-jc' ? tappalsAssignedToJC : tappalsUnderJC;

  const openTappal = (id: string) => navigate(`/tappal/${id}`);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="bg-white rounded-xl p-6">
        <h1 className="text-2xl font-bold">Joint Collector Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage tappals under your supervision
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tappals under JC" value={totalTappalsUnderJC.length} icon={FileText} />
        <StatCard title="Overdue Tappals" value={overdueCount} icon={AlertTriangle} danger />
        <StatCard title="Officers Supervised" value={officers.length} icon={Users} blue />
        <StatCard title="Assigned to JC" value={tappalsAssignedToJC.length} icon={User} purple />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RECENT TAPPALS */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Tappals</h2>
            <div className="flex gap-2">
              <ToggleButton
                active={viewMode === 'assigned-to-jc'}
                onClick={() => setViewMode('assigned-to-jc')}
                text="Assigned to JC"
              />
              <ToggleButton
                active={viewMode === 'assigned-to-officers'}
                onClick={() => setViewMode('assigned-to-officers')}
                text="Assigned to Officers"
              />
            </div>
          </div>

          {displayTappals.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              No tappals assigned to you
            </div>
          ) : (
            <div className="space-y-3">
              {displayTappals.slice(0, 5).map((t: any) => {
                const rawStatus = String(t.status || '').trim().toLowerCase();
                const fullClass = getStatusColor(t.status);
                // For 'in progress', 'forward', 'pending', 'active', and 'completed' statuses, remove background classes
                const stripBg = rawStatus.includes('in progress') || rawStatus.includes('in_progress') || rawStatus.includes('inprogress') || rawStatus.includes('forward') || rawStatus.includes('pending') || rawStatus.includes('active') || rawStatus.includes('completed');
                const statusClass = stripBg ? (fullClass.split(' ').find(p => p.startsWith('text-')) || 'text-gray-600') : fullClass;

                return (
                  <div
                    key={t.tappalId}
                    onClick={() => openTappal(t.tappalId)}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{t.tappalId}</p>
                        <p className="text-sm text-gray-600 truncate">{t.subject}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex gap-1 items-center">
                            <User className="h-3 w-3" /> {t.assignedToName}
                          </span>
                          <span className="flex gap-1 items-center">
                            <Building className="h-3 w-3" /> {t.department || t.departmentName}
                          </span>
                          <span className="flex gap-1 items-center">
                            <Calendar className="h-3 w-3" /> {formatDate(t.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* STATUS – SAME POSITION, NO BG for in-progress/forward */}
                      <span className={`px-3 py-1 text-xs rounded-full ${statusClass}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QUICK ACCESS */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>

          <QuickLink title="Track Petitions" icon={ScrollText} iconBg="bg-green-100" iconColor="text-green-600" onClick={() => navigate('petitions')} />
          <QuickLink title="All Tappals" icon={FileText} iconBg="bg-gray-100" iconColor="text-gray-700" onClick={() => navigate('all-tappals')} />
          <QuickLink title="My Assigned Tappals" icon={FileText} count={tappalsAssignedToJC.length} iconBg="bg-indigo-100" iconColor="text-indigo-600" onClick={() => navigate('my-tappals')} />
          <QuickLink title="Officer-wise Tracker" icon={Users} count={tappalsUnderJC.length} iconBg="bg-blue-100" iconColor="text-blue-600" onClick={() => navigate('officer-tappals')} />
          <QuickLink title="Overdue Tappals" icon={Clock} count={overdueCount} bg="bg-red-50" iconBg="bg-red-100" iconColor="text-red-600" onClick={() => navigate('overdue')} />
          <QuickLink title="Performance Analytics" icon={BarChart3} iconBg="bg-purple-100" iconColor="text-purple-600" onClick={() => navigate('analytics')} />
          <QuickLink title="Global Search" icon={Search} iconBg="bg-teal-100" iconColor="text-teal-600" onClick={() => navigate('search')} />
        </div>

      </div>
    </div>
  );
};

/* ================= UI COMPONENTS ================= */

const StatCard = ({ title, value, icon: Icon, danger, blue, purple }: any) => {
  const color =
    danger ? 'red' : blue ? 'blue' : purple ? 'indigo' : 'indigo';

  return (
    <div className="bg-white rounded-xl p-6 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>
          {value}
        </p>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  );
};

const ToggleButton = ({ active, onClick, text }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
      active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
    }`}
  >
    {text}
  </button>
);

const QuickLink = ({ title, icon: Icon, onClick, count, bg, iconBg, iconColor }: any) => (
  <button
    onClick={onClick}
    className={`w-full border rounded-lg p-4 flex justify-between items-center mb-2 ${bg || 'bg-white hover:bg-gray-50'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <span className="font-medium">{title}</span>
    </div>
    {count !== undefined && (
      <span className="text-sm font-semibold text-indigo-700">
        {count}
      </span>
    )}
  </button>
);

export default JointCollectorDashboardMain;

