import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Calendar,
  Building,
  User,
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  formatDate,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  getDaysOverdue,
} from "../../utils/dateUtils";

/* ================= API ================= */
const OFFICER_API =
  "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

const TAPPALS_API =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

/* ================= TYPES ================= */
interface Officer {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface Tappal {
  id: string;
  tappalId: string;
  subject: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  department: string;
  priority: string;
  status: string;
  expiryDate: string;
}

/* ================= COMPONENT ================= */
const OfficerTappals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);

  const [filters, setFilters] = useState({
    department: "",
    status: "",
    officer: "",
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        const [officerRes, tappalRes] = await Promise.all([
          axios.get(OFFICER_API),
          axios.get(TAPPALS_API),
        ]);

        const allOfficers: Officer[] = Array.isArray(
          officerRes.data?.officers
        )
          ? officerRes.data.officers
          : [];

        const allTappals: Tappal[] = Array.isArray(tappalRes.data)
          ? tappalRes.data
          : [];

        /* 🔹 SUBORDINATE ROLES UNDER RDO */
        const SUBORDINATE_ROLES = [
          "tahsildar",
          "revenue inspector",
          "ri",
          "village revenue officer",
          "vro",
          "clerk",
        ];

        /* 🔹 OFFICERS UNDER RDO */
        const subordinateOfficers = allOfficers.filter((o) =>
          SUBORDINATE_ROLES.includes(o.role?.toLowerCase())
        );

        const subordinateIds = subordinateOfficers.map((o) => o.id);

        /* 🔹 TAPPALS UNDER RDO */
        const subordinateTappals = allTappals.filter(
          (t) => t.assignedTo && subordinateIds.includes(t.assignedTo)
        );

        /* 🔹 ONLY OFFICERS WHO HAVE TAPPALS */
        const officersWithTappalsMap = new Map<string, Officer>();

        subordinateTappals.forEach((t) => {
          const officer = subordinateOfficers.find(
            (o) => o.id === t.assignedTo
          );
          if (officer) {
            officersWithTappalsMap.set(officer.id, officer);
          }
        });

        setOfficers(Array.from(officersWithTappalsMap.values()));
        setTappals(subordinateTappals);
      } catch (error) {
        console.error("Failed to load subordinate tappals", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  /* ================= DROPDOWNS ================= */
  const departments = useMemo(
    () => [...new Set(tappals.map((t) => t.department).filter(Boolean))],
    [tappals]
  );

  const statuses = useMemo(
    () => [...new Set(tappals.map((t) => t.status).filter(Boolean))],
    [tappals]
  );

  /* ================= FILTERED DATA ================= */
  const filteredTappals = useMemo(() => {
    return tappals.filter((t) => {
      return (
        (!filters.department || t.department === filters.department) &&
        (!filters.status || t.status === filters.status) &&
        (!filters.officer || t.assignedTo === filters.officer)
      );
    });
  }, [tappals, filters]);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    return {
      total: tappals.length,
      pending: tappals.filter((t) => t.status === "Pending").length,
      inProgress: tappals.filter((t) => t.status === "In Progress").length,
      completed: tappals.filter((t) => t.status === "Completed").length,
      overdue: tappals.filter((t) =>
        isOverdue(t.expiryDate, t.status)
      ).length,
    };
  }, [tappals]);

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Subordinate Officer Tappals</h1>
        <p className="text-gray-600">
          Only tappals assigned to officers under RDO
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-5 gap-4">
        <Stat title="Total" value={stats.total} icon={FileText} />
        <Stat title="Pending" value={stats.pending} icon={Calendar} />
        <Stat title="In Progress" value={stats.inProgress} icon={Users} />
        <Stat title="Completed" value={stats.completed} icon={Calendar} />
        <Stat title="Overdue" value={stats.overdue} icon={Calendar} />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <select
            className="border rounded-lg px-3 py-2"
            value={filters.department}
            onChange={(e) =>
              setFilters((p) => ({ ...p, department: e.target.value }))
            }
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2"
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2"
            value={filters.officer}
            onChange={(e) =>
              setFilters((p) => ({ ...p, officer: e.target.value }))
            }
          >
            <option value="">All Officers</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b font-semibold">
          Subordinate Officer Tappals ({filteredTappals.length})
        </div>

        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filteredTappals.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No subordinate tappals found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Tappal ID</th>
                <th className="px-6 py-3 text-left">Subject</th>
                <th className="px-6 py-3 text-left">Officer</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Expiry</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredTappals.map((t) => (
                <tr key={t.tappalId}>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/tappal/${t.tappalId}`)}
                      className="text-blue-600 flex items-center gap-1"
                    >
                      {t.tappalId}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4">{t.subject}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {t.assignedToName}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    {t.department}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {formatDate(t.expiryDate)}
                    {isOverdue(t.expiryDate, t.status) && (
                      <div className="text-xs text-red-600">
                        {getDaysOverdue(t.expiryDate)} days overdue
                      </div>
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

/* ================= STAT CARD ================= */
const Stat = ({
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

export default OfficerTappals;
