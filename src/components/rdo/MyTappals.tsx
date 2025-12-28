import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/ToastContainer";
import {
  FileText,
  Calendar,
  Building,
  CheckCircle,
  Filter,
  ExternalLink,
  Paperclip,
  Eye,
  Send,
} from "lucide-react";
import {
  formatDate,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  getDaysOverdue,
} from "../../utils/dateUtils";

/* 🔴 TAPPALS API */
const TAPPALS_API =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

interface Tappal {
  id: string;
  tappalId: string;
  subject: string;
  description: string;
  assignedTo: string;
  departmentName: string;
  priority: string;
  status: string;
  expiryDate: string;
  attachments: string[];
}

const MyTappals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // RDO user
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
  });

  /* ================= FETCH TAPPALS ================= */
  useEffect(() => {
    if (!user?.id) return;

    const fetchTappals = async () => {
      try {
        const res = await axios.get(TAPPALS_API);

        const normalized: Tappal[] = (res.data || [])
          // ✅ ONLY DIRECTLY ASSIGNED TO LOGGED-IN RDO
          .filter((t: any) => t.assignedTo === user.id)
          .map((t: any) => ({
            id: t.id || t.tappalId,
            tappalId: t.tappalId,
            subject: t.subject,
            description: t.description,
            assignedTo: t.assignedTo,

            // ✅ department fallback
            departmentName: t.departmentName || t.department || "-",

            // ✅ status normalization
            status:
              t.status === "Active"
                ? "Pending"
                : t.status === "Closed"
                ? "Completed"
                : t.status,

            priority: t.priority || "Medium",
            expiryDate: t.expiryDate,
            attachments: t.attachments || [],
          }));

        setTappals(normalized);
      } catch (err) {
        console.error(err);
        showToast({
          type: "error",
          title: "Error",
          message: "Failed to load tappals",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTappals();
  }, [user, showToast]);

  /* ================= DYNAMIC STATUS DROPDOWN ================= */
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    tappals.forEach((t) => {
      if (t.status) set.add(t.status);
    });
    return Array.from(set);
  }, [tappals]);

  /* ================= FILTERED DATA ================= */
  const filteredTappals = useMemo(() => {
    return tappals.filter((t) => {
      const statusMatch =
        !filters.status || t.status === filters.status;

      const deptMatch =
        !filters.department ||
        t.departmentName
          .toLowerCase()
          .includes(filters.department.toLowerCase());

      return statusMatch && deptMatch;
    });
  }, [tappals, filters]);

  /* ================= STATS ================= */
  const stats = {
    total: tappals.length,
    pending: tappals.filter((t) => t.status === "Pending").length,
    completed: tappals.filter((t) => t.status === "Completed").length,
    overdue: tappals.filter((t) =>
      isOverdue(t.expiryDate, t.status)
    ).length,
  };

  /* ================= HANDLERS ================= */
  const handleView = (id: string) => navigate(`/tappal/${id}`);
  const handleForward = (id: string) =>
    navigate(`/rdo-dashboard/forward-tappal?tappal=${id}`);

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          My Assigned Tappals
        </h1>
        <p className="text-gray-600">
          Tappals assigned directly to you as RDO
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Assigned" value={stats.total} icon={FileText} />
        <StatCard title="Pending" value={stats.pending} icon={Calendar} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} />
        <StatCard title="Overdue" value={stats.overdue} icon={Calendar} />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* ✅ STATUS DROPDOWN (DYNAMIC) */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* DEPARTMENT SEARCH */}
          <input
            placeholder="Search department..."
            className="border rounded-lg px-3 py-2"
            value={filters.department}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                department: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            My Tappals ({filteredTappals.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : filteredTappals.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No tappals found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Tappal ID</th>
                <th className="px-6 py-3 text-left">Subject</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Expiry</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredTappals.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleView(t.tappalId)}
                      className="text-blue-600 flex items-center gap-1"
                    >
                      {t.tappalId}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>

                  <td className="px-6 py-4">{t.subject}</td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    {t.departmentName}
                  </td>

                  <td className="px-6 py-4">
                    {formatDate(t.expiryDate)}
                    {isOverdue(t.expiryDate, t.status) && (
                      <div className="text-xs text-red-600">
                        {getDaysOverdue(t.expiryDate)} days overdue
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        t.status
                      )}`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                  </td>

                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleForward(t.tappalId)}
                      className="text-blue-600"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <Eye className="h-4 w-4 text-gray-500" />
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

/* ================= STAT CARD ================= */
const StatCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: any;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex justify-between">
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <Icon className="h-8 w-8 text-gray-400" />
  </div>
);

export default MyTappals;
