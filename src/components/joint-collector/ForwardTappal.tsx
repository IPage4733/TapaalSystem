import React, { useEffect, useMemo, useState } from "react";
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

/* ================= APIs ================= */

const TAPPAL_API =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

const OFFICER_API =
  "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

const FORWARD_API =
  "https://eppkpabk61.execute-api.ap-southeast-1.amazonaws.com/dev/tapal";

/* ================= COMPONENT ================= */

const ForwardTappal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preSelectedTappal = searchParams.get("tappal");

  const [tappals, setTappals] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTappalId, setSelectedTappalId] = useState(
    preSelectedTappal || ""
  );
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [reason, setReason] = useState("");

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tappalRes, officerRes] = await Promise.all([
          axios.get(TAPPAL_API),
          axios.get(OFFICER_API),
        ]);

        setTappals(tappalRes.data || []);
        setOfficers(officerRes.data?.officers || []);
      } catch {
        showToast({
          type: "error",
          title: "Error",
          message: "Failed to load tappals or officers",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= MY TAPPALS ================= */

  const myTappals = useMemo(() => {
    if (!user) return [];
    return tappals.filter((t) => t.assignedTo === user.id);
  }, [tappals, user]);

  /* ================= FORWARD ELIGIBLE ================= */
  // ONLY ACTIVE tappals can be forwarded
  const forwardEligibleTappals = useMemo(() => {
    return myTappals.filter(
      (t) => t.status?.toUpperCase() === "ACTIVE"
    );
  }, [myTappals]);

  /* ================= COUNTS ================= */

  const pendingCount = useMemo(() => {
    return myTappals.filter(
      (t) => t.status?.toUpperCase() === "FORWARDED"
    ).length;
  }, [myTappals]);

  /* ================= OFFICERS BELOW ================= */

  const officersBelow = useMemo(() => {
    return officers.filter((o) => {
      const role = o.role?.toLowerCase() || "";
      return (
        role.includes("tahsildar") ||
        role.includes("tashildhar") ||
        role.includes("rdo") ||
        role.includes("inspector") ||
        role.includes("village") ||
        role.includes("vro")
      );
    });
  }, [officers]);

  /* ================= SELECTED ================= */

  const selectedTappal = forwardEligibleTappals.find(
    (t) => t.tappalId === selectedTappalId
  );

  const selectedOfficer = officersBelow.find(
    (o) => o.id === selectedOfficerId
  );

  /* ================= FORWARD ================= */

  const handleForward = async () => {
    if (!selectedTappal || !selectedOfficer || !reason.trim()) {
      showToast({
        type: "error",
        title: "Missing Fields",
        message: "Select tappal, officer and reason",
      });
      return;
    }

    try {
      const url = `${FORWARD_API}/${selectedTappal.tappalId}/forward`;

      const body = {
        fromOfficerId: user.id,
        fromOfficerName: user.name,
        fromOfficerRole: user.role,
        fromDepartment: user.department,
        fromOfficerPhone: user.phone || "0000000000",

        toOfficerId: selectedOfficer.id,
        toOfficerName: selectedOfficer.name,
        toOfficerRole: selectedOfficer.role,
        toDepartment: selectedOfficer.department,
        toOfficerPhone: selectedOfficer.phone,

        reason,
      };

      await axios.post(url, body);

      showToast({
        type: "success",
        title: "Success",
        message: "Tappal forwarded successfully",
      });

      setSelectedTappalId("");
      setSelectedOfficerId("");
      setReason("");
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed",
        message: err?.response?.data?.error || "Forward failed",
      });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Forward Tappal</h1>
        <p className="text-gray-600">
          Forward tappals assigned to you
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Available to Forward</p>
          <p className="text-2xl font-bold text-indigo-600">
            {forwardEligibleTappals.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Officers Available</p>
          <p className="text-2xl font-bold text-blue-600">
            {officersBelow.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Forward Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* FORWARD FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <h2 className="text-lg font-semibold">Forward Tappal</h2>

        {/* SELECT TAPPAL */}
        <select
          value={selectedTappalId}
          onChange={(e) => setSelectedTappalId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Choose tappal...</option>
          {forwardEligibleTappals.map((t) => (
            <option key={t.tappalId} value={t.tappalId}>
              {t.tappalId} - {t.subject}
            </option>
          ))}
        </select>

        {/* DETAILS */}
        {selectedTappal && (
          <div className="bg-indigo-50 p-4 rounded-lg border">
            <p><b>ID:</b> {selectedTappal.tappalId}</p>
            <p><b>Department:</b> {selectedTappal.department}</p>
            <p><b>Status:</b> {selectedTappal.status}</p>
            <p><b>Expiry:</b> {formatDate(selectedTappal.expiryDate)}</p>
          </div>
        )}

        {/* SELECT OFFICER */}
        <select
          value={selectedOfficerId}
          onChange={(e) => setSelectedOfficerId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Choose officer...</option>
          {officersBelow.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.role}
            </option>
          ))}
        </select>

        {/* REASON */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Enter reason..."
        />

        <div className="flex justify-end">
          <button
            onClick={handleForward}
            disabled={!selectedTappal || !selectedOfficer || !reason.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Forward Tappal
          </button>
        </div>
      </div>

      {/* TABLE */}
      {forwardEligibleTappals.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Forward Eligible Tappals ({forwardEligibleTappals.length})
          </h2>

          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Tappal ID</th>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Select</th>
              </tr>
            </thead>

            <tbody>
              {forwardEligibleTappals.map((t) => (
                <tr key={t.tappalId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
  <button
    type="button"
    onClick={() =>
      navigate(`/tappal/${t.tappalId}/movement`)
    }
    className="text-indigo-600 hover:underline font-medium"
  >
    {t.tappalId}
  </button>
</td>


                  <td className="px-4 py-2">{t.subject}</td>
                  <td className="px-4 py-2">{t.department}</td>

                  <td className="px-4 py-2">
                    <span className={getStatusColor(t.status)}>
                      {t.status}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    <span className={getPriorityColor(t.priority)}>
                      {t.priority}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedTappalId(t.tappalId)}
                      className="text-indigo-600"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ForwardTappal;
