import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import {
  FileText,
  Calendar,
  Building,
  Send,
  Eye,
  CheckCircle,
  Filter,
  ExternalLink
} from 'lucide-react';

import {
  formatDate,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  getDaysOverdue
} from '../../utils/dateUtils';

const TAPPALS_API =
  'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';

const MyTappals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tappals, setTappals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: '',
    department: ''
  });

  // 🔹 Fetch tappals
  useEffect(() => {
    const fetchTappals = async () => {
      try {
        const res = await fetch(TAPPALS_API);
        const data = await res.json();
        setTappals(Array.isArray(data) ? data : []);
      } catch {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load tappals'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTappals();
  }, [showToast]);

  // 🔹 Only Joint Collector tappals
  const myTappals = useMemo(() => {
    if (!user?.id) return [];
    return tappals.filter(
      t => (t.assignedTo || '').trim() === user.id.trim()
    );
  }, [tappals, user]);

  // 🔹 Dynamic status list (IMPORTANT FIX)
  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(myTappals.map(t => t.status).filter(Boolean))
    );
  }, [myTappals]);

  // 🔹 Filters
  const filteredTappals = useMemo(() => {
    return myTappals.filter(t => {
      const statusMatch =
        !filters.status || t.status === filters.status;

      const deptMatch =
        !filters.department ||
        (t.department || t.departmentName || '')
          .toLowerCase()
          .includes(filters.department.toLowerCase());

      return statusMatch && deptMatch;
    });
  }, [myTappals, filters]);

  // 🔹 Stats
  const stats = useMemo(() => ({
    total: myTappals.length,
    pending: myTappals.filter(t => t.status === 'Pending').length,
    completed: myTappals.filter(t => t.status === 'Completed').length,
    overdue: myTappals.filter(t =>
      isOverdue(t.expiryDate, t.status)
    ).length
  }), [myTappals]);

  // 🔹 Handlers
  const handleTappalClick = (id: string) =>
    navigate(`/tappal/${id}`);

  const handleForward = (id: string) =>
    navigate(`/joint-collector-dashboard/forward-tappal?tappal=${id}`);

  const handleMarkReviewed = (id: string) =>
    showToast({
      type: 'success',
      title: 'Reviewed',
      message: `${id} marked as reviewed`
    });

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          My Assigned Tappals
        </h1>
        <p className="text-gray-600">
          Tappals assigned directly to you as Joint Collector
        </p>
      </div>

      {/* Stats – OLD UI RESTORED */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Assigned" value={stats.total} icon={<FileText className="h-8 w-8 text-indigo-600" />} />
        <StatCard title="Pending" value={stats.pending} icon={<Calendar className="h-8 w-8 text-orange-600" />} />
        <StatCard title="Completed" value={stats.completed} icon={<CheckCircle className="h-8 w-8 text-green-600" />} />
        <StatCard title="Overdue" value={stats.overdue} icon={<Calendar className="h-8 w-8 text-red-600" />} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            placeholder="Search department..."
            value={filters.department}
            onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            My Tappals ({filteredTappals.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filteredTappals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No tappals found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Tappal ID','Subject','Department','Expiry','Status','Priority','Attachments','Actions']
                  .map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTappals.map(t => (
                <tr key={t.tappalId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button onClick={() => handleTappalClick(t.tappalId)} className="text-indigo-600 flex items-center gap-1">
                      {t.tappalId} <ExternalLink size={12} />
                    </button>
                  </td>
                  <td className="px-6 py-4">{t.subject}</td>
                  <td className="px-6 py-4">{t.department || t.departmentName}</td>
                  <td className="px-6 py-4">
                    {formatDate(t.expiryDate)}
                    {isOverdue(t.expiryDate, t.status) && (
                      <div className="text-xs text-red-600">
                        {getDaysOverdue(t.expiryDate)} days overdue
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusColor(t.status)}>{t.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getPriorityColor(t.priority)}>{t.priority}</span>
                  </td>
                  <td className="px-6 py-4">No files</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleForward(t.tappalId)} className="text-indigo-600">
                      <Send size={14} /> Forward
                    </button>
                    {t.status !== 'Completed' && (
                      <button onClick={() => handleMarkReviewed(t.tappalId)} className="text-green-600">
                        <CheckCircle size={14} /> Reviewed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyTappals;

/* 🔹 Stat Card (OLD UI) */
const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);
