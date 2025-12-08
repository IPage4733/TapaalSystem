import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  Users,
  AlertTriangle,
  Calendar,
  User,
  Building,
  Send,
  Filter,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/* -------------------- TYPES -------------------- */
type Tappal = {
  tappalId: string;
  subject?: string;
  assignedTo?: string;
  assignedToName?: string;
  department?: string;
  departmentName?: string;
  status?: string;
  createdAt?: string;
  expiryDate?: string;
};

type Officer = {
  id: string;
  name: string;
  role: string;
  department?: string;
};

/* -------------------- API URLS -------------------- */
const OFFICER_API =
  "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

const TAPPAL_API =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

/* -------------------- HELPERS -------------------- */

const formatDate = (d?: string) => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString();
};

const isOverdue = (expiry?: string, status?: string) => {
  if (!expiry) return false;

  const closed = ["FINALIZED", "COMPLETED", "CLOSED"];
  if (status && closed.includes(status.toUpperCase())) return false;

  const today = new Date();
  const exp = new Date(expiry);

  return exp < new Date(today.setHours(0, 0, 0, 0));
};

/* -------------------- STATUS BADGE COLORS -------------------- */
const getStatusColor = (status?: string) => {
  if (!status) return "bg-gray-200 text-gray-700";

  const s = status.toLowerCase();

  if (s.includes("active")) return "bg-green-200 text-green-800";
  if (s.includes("forward")) return "bg-yellow-200 text-yellow-800";
  if (s.includes("pending")) return "bg-gray-200 text-gray-800";
  if (s.includes("completed") || s.includes("finalized"))
    return "bg-green-200 text-green-800";

  return "bg-gray-200 text-gray-700";
};

/* -------------------- COMPONENT -------------------- */

const TahsildarDashboardMain: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tappals, setTappals] = useState<Tappal[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filterMode, setFilterMode] =
    useState<"all" | "assigned-to-me" | "forwarded">("all");
  const [loading, setLoading] = useState(true);

  /* -------------------- FETCH -------------------- */
  useEffect(() => {
    Promise.all([
      fetch(OFFICER_API).then((r) => r.json()),
      fetch(TAPPAL_API).then((r) => r.json()),
    ])
      .then(([o, t]) => {
        setOfficers(o.officers || []);
        setTappals(Array.isArray(t) ? t : t.tappals || []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* -------------------- OFFICERS UNDER COMMAND -------------------- */
  const officersBelow = useMemo(() => {
    if (!user?.id) return [];

    const allowedRoles = [
      "naib tahsildar",
      "naib_tahsildar",
      "revenue inspector",
      "ri",
      "village revenue officer",
      "vro",
      "clerk",
    ];

    const exclude = ["tahsildar", "collector", "admin", "dro"];

    return officers.filter((o) => {
      if (!o.role) return false;

      const role = o.role.toLowerCase();
      if (o.id === user.id) return false;
      if (exclude.some((ex) => role.includes(ex))) return false;

      return allowedRoles.some((r) => role.includes(r));
    });
  }, [officers, user]);

  /* -------------------- FILTERS -------------------- */
  const myTappals = tappals.filter((t) => t.assignedTo === user?.id);

  const officerIds = officersBelow.map((o) => o.id);

  const officerTappals = tappals.filter(
    (t) => t.assignedTo && officerIds.includes(t.assignedTo)
  );

  /* -------------------- STATS -------------------- */
  const overdueTappalsInMandal =
    [...myTappals, ...officerTappals].filter((t) =>
      isOverdue(t.expiryDate, t.status)
    ).length;

  const totalTappalsInMandal = myTappals.length + officerTappals.length;

  const officersUnderCommand = officersBelow.length;

  /* ---------------------------------------------------------
     CORRECT FORWARDED COUNT (TRUE DASHBOARD LOGIC)
     --------------------------------------------------------- */

  const forwardedTappalsCount = [...myTappals, ...officerTappals].filter(
    (t) => t.status?.toLowerCase().includes("forward")
  ).length;

  /* -------------------- RECENT -------------------- */
  const recentTappals = useMemo(() => {
    let data: Tappal[] = [];

    if (filterMode === "assigned-to-me") data = myTappals;
    else if (filterMode === "forwarded") data = officerTappals;
    else data = [...myTappals, ...officerTappals];

    return data
      .sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
      )
      .slice(0, 5);
  }, [filterMode, myTappals, officerTappals]);

  const openTappal = (id: string) => navigate(`/tappal/${id}`);

  /* -------------------- LOADING -------------------- */
  if (loading)
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  /* -------------------- UI -------------------- */
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Tahsildar Dashboard</h1>
        <p className="text-gray-600">
          Monitor and manage tappals under your mandal
        </p>
      </div>

      {/* -------------------- Stats Grid -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tappals in Mandal</p>
              <p className="text-2xl font-bold">{totalTappalsInMandal}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned to Tahsildar</p>
              <p className="text-2xl font-bold text-green-600">
                {myTappals.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <User className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Tappals</p>
              <p className="text-2xl font-bold text-red-600">
                {overdueTappalsInMandal}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Officers Under Command</p>
              <p className="text-2xl font-bold text-blue-600">
                {officersUnderCommand}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- Recent + Quick Access -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tappals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Tappals</h2>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="text-sm border rounded-lg px-2 py-1"
              >
                <option value="all">All</option>
                <option value="assigned-to-me">Assigned to Me</option>
                <option value="forwarded">Forwarded</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {recentTappals.map((t) => (
              <div
                key={t.tappalId}
                onClick={() => openTappal(t.tappalId)}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{t.tappalId}</p>
                    <p className="text-gray-600">{t.subject}</p>

                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {t.assignedToName}
                      </span>

                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {t.departmentName || t.department}
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* -------- CAPSULE STATUS BADGE -------- */}
                  <span
                    className={`h-6 min-w-[72px] flex items-center justify-center px-3 text-[11px] font-semibold rounded-full ${getStatusColor(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>

          <div className="space-y-3">
            {[
              {
                title: "My Assigned Tappals",
                desc: "Tappals assigned to me",
                color: "green",
                icon: FileText,
                path: "/tahsildar-dashboard/my-tappals",
                count: myTappals.length,
              },
              {
                title: "Subordinate Officer Tappals",
                desc: "Track officer assignments",
                color: "blue",
                icon: Users,
                path: "/tahsildar-dashboard/officer-tappals",
                count: officerTappals.length,
              },
              {
                title: "Forward Tappals",
                desc: "Forward my tappals",
                color: "emerald",
                icon: Send,
                path: "/tahsildar-dashboard/forward-tappal",
                count: forwardedTappalsCount, // 🔥 corrected
              },
              {
                title: "Overdue Tappals",
                desc: "Manage overdue items",
                color: "red",
                icon: Clock,
                path: "/tahsildar-dashboard/overdue",
                count: overdueTappalsInMandal,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className={`p-4 border rounded-lg flex justify-between w-full hover:bg-${item.color}-50`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${item.color}-100 rounded-lg`}>
                      <Icon className={`text-${item.color}-600`} />
                    </div>

                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>

                  {/* Correct Capsule Count Badge */}
                  {item.count !== undefined && (
                    <span
                      className={`h-5 min-w-[22px] flex items-center justify-center px-2 text-[10px] rounded-full bg-${item.color}-100 text-${item.color}-700`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TahsildarDashboardMain;
