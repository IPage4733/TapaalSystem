import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/ToastContainer";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Send,
  FileText,
  User,
  Building,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  formatDate,
  getStatusColor,
  getPriorityColor,
} from "../../utils/dateUtils";

const ForwardTappal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preSelectedTappal = searchParams.get("tappal");

  const [tappals, setTappals] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTappalId, setSelectedTappalId] = useState(preSelectedTappal || "");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [reason, setReason] = useState("");

  // =============================
  // 🔥 FETCH TAPPLALS + OFFICERS
  // =============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tappalRes = await axios.get(
          "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals"
        );

        const officerRes = await axios.get(
          "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer"
        );

        setTappals(tappalRes.data || []);
        setOfficers(officerRes.data.officers || []);
      } catch (err) {
        showToast({
          type: "error",
          title: "Error",
          message: "Unable to load tappals or officers.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =============================
  // 🔥 FILTER TAPPLALS FOR CURRENT USER
  // =============================
  const myTappals = useMemo(() => {
    return tappals.filter((t) => t.assignedTo === user?.id);
  }, [tappals, user]);

  // =============================
  // 🔥 FILTER OFFICERS BELOW CURRENT ROLE
  // =============================
  const officersBelow = useMemo(() => {
    return officers.filter((o) => {
      const role = o.role?.toLowerCase() || "";
      return (
        role.includes("tahsildar") ||
        role.includes("tashildhar") ||
        role.includes("rdo") ||
        role.includes("inspector") ||
        role.includes("revenue inspector") ||
        role.includes("village revenue officer") ||
        role.includes("vro")
      );
    });
  }, [officers]);

  const selectedTappal = myTappals.find((t) => t.tappalId === selectedTappalId);
  const selectedOfficer = officersBelow.find((o) => o.id === selectedOfficerId);

  // =============================
  // ⭐ RESOLVE fromOfficerPhone
  // =============================
  const resolvedUserPhone = useMemo(() => {
    if (user?.phone) return user.phone;

    const match = officers.find((o) => o.id === user?.id);
    return match?.phone || "0000000000";
  }, [user, officers]);

  // =============================
  // 🔥 FORWARD TAPPLAL
  // =============================
  const handleForward = async () => {
    if (!selectedTappal || !selectedOfficer || !reason.trim()) {
      showToast({
        type: "error",
        title: "Missing Fields",
        message: "Select tappal, officer and reason.",
      });
      return;
    }

    try {
      const url = `https://eppkpabk61.execute-api.ap-southeast-1.amazonaws.com/dev/tapal/${selectedTappal.tappalId}/forward`;

      const body = {
        fromOfficerId: user.id,
        fromOfficerName: user.name,
        fromOfficerRole: user.role,
        fromDepartment: user.department,
        fromOfficerPhone: resolvedUserPhone,

        toOfficerId: selectedOfficer.id,
        toOfficerName: selectedOfficer.name,
        toOfficerRole: selectedOfficer.role,
        toDepartment: selectedOfficer.department,
        toOfficerPhone: selectedOfficer.phone,

        reason: reason,
      };

      const res = await axios.post(url, body);

      showToast({
        type: "success",
        title: "Success",
        message: res.data.message || "Tappal forwarded!",
      });

      setSelectedTappalId("");
      setSelectedOfficerId("");
      setReason("");
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed",
        message: err?.response?.data?.error || "Error forwarding tappal.",
      });
    }
  };

  // ========================= UI BELOW =============================

  const getRoleDisplayName = (role: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("tahsildar") || r.includes("tashildhar")) return "Tahsildar";
    if (r.includes("rdo")) return "Revenue Divisional Officer";
    if (r.includes("inspector")) return "Revenue Inspector";
    if (r.includes("village")) return "Village Revenue Officer";
    return role;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Forward Tappal</h1>
        <p className="text-gray-600">Forward tappals assigned to you</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Available to Forward</p>
          <p className="text-2xl font-bold text-purple-600">{myTappals.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Officers Available</p>
          <p className="text-2xl font-bold text-blue-600">{officersBelow.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {myTappals.filter((t) => t.status === "Pending").length}
          </p>
        </div>
      </div>

      {/* FORWARD FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <h2 className="text-lg font-semibold">Forward Tappal</h2>

        {/* SELECT TAPPAL */}
        <div>
          <label className="text-sm">Select Tappal *</label>
          <select
            value={selectedTappalId}
            onChange={(e) => setSelectedTappalId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Choose tappal...</option>
            {myTappals.map((t) => (
              <option key={t.tappalId} value={t.tappalId}>
                {t.tappalId} - {t.subject}
              </option>
            ))}
          </select>
        </div>

        {/* DETAILS */}
        {selectedTappal && (
          <div className="bg-purple-50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Tappal Details</h3>
            <p><b>ID:</b> {selectedTappal.tappalId}</p>
            <p><b>Department:</b> {selectedTappal.department}</p>
            <p><b>Expiry:</b> {formatDate(selectedTappal.expiryDate)}</p>
            <p><b>Status:</b> {selectedTappal.status}</p>
            <p><b>Subject:</b> {selectedTappal.subject}</p>
          </div>
        )}

        {/* SELECT OFFICER */}
        <div>
          <label className="text-sm">Forward to Officer *</label>
          <select
            value={selectedOfficerId}
            onChange={(e) => setSelectedOfficerId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Choose officer...</option>
            {officersBelow.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {getRoleDisplayName(o.role)}
              </option>
            ))}
          </select>
        </div>

        {/* OFFICER DETAILS */}
        {selectedOfficer && (
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Officer Details</h3>
            <p><b>Name:</b> {selectedOfficer.name}</p>
            <p><b>Role:</b> {getRoleDisplayName(selectedOfficer.role)}</p>
            <p><b>Department:</b> {selectedOfficer.department}</p>
            <p><b>Phone:</b> {selectedOfficer.phone}</p>
          </div>
        )}

        {/* REASON */}
        <div>
          <label className="text-sm">Reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter reason..."
          />
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 border rounded-lg"
            onClick={() => {
              setSelectedTappalId("");
              setSelectedOfficerId("");
              setReason("");
            }}
          >
            Clear
          </button>

          <button
            onClick={handleForward}
            disabled={!selectedTappal || !selectedOfficer || !reason.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            Forward Tappal
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Your Tappals ({myTappals.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs">Tappal ID</th>
                <th className="px-6 py-3 text-left text-xs">Subject</th>
                <th className="px-6 py-3 text-left text-xs">Department</th>
                <th className="px-6 py-3 text-left text-xs">Status</th>
                <th className="px-6 py-3 text-left text-xs">Priority</th>
                <th className="px-6 py-3 text-left text-xs">Select</th>
              </tr>
            </thead>

            <tbody>
              {myTappals.map((t) => (
                <tr key={t.tappalId} className="border-b hover:bg-gray-50">

                  {/* CLICKABLE TAPPAL ID */}
                  <td
                    className="px-6 py-4 text-purple-600 font-medium cursor-pointer hover:underline"
                    onClick={() => navigate(`/tappal/${t.tappalId}`)}
                  >
                    {t.tappalId}
                  </td>

                  <td className="px-6 py-4">{t.subject}</td>
                  <td className="px-6 py-4">{t.department}</td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedTappalId(t.tappalId)}
                      className="text-purple-600"
                    >
                      Select
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default ForwardTappal;
