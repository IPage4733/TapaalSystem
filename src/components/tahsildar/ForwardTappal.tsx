import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/ToastContainer";
import { useSearchParams, useNavigate } from "react-router-dom";

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

  // ------------------ Fetch Data ------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res1 = await fetch(
          "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals"
        );
        const tappalData = await res1.json();
        setTappals(Array.isArray(tappalData) ? tappalData : tappalData?.tappals || []);

        const res2 = await fetch(
          "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer"
        );
        const officerData = await res2.json();
        setOfficers(Array.isArray(officerData) ? officerData : officerData.officers || []);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        showToast({
          type: "error",
          title: "Error",
          message: "Failed to load tappals or officers",
        });
      }
    };

    fetchAll();
  }, []);

  // ------------------ Tappals Assigned to User ------------------
  const myTappals = useMemo(() => {
    return tappals.filter((t) => t.assignedTo === user?.id);
  }, [tappals, user]);

  // ------------------ Officer Filter (Only Required 4 Roles) ------------------
  const officersBelow = useMemo(() => {
    return officers.filter((o) => {
      const r = o.role?.toLowerCase() || "";

      if (r.includes("naib")) return true;
      if (r.includes("revenue inspector") || r === "ri") return true;
      if (r.includes("village revenue officer") || r === "vro") return true;
      if (r.includes("clerk")) return true;

      return false;
    });
  }, [officers]);

  const getRoleDisplayName = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("naib")) return "Naib Tahsildar";
    if (r.includes("revenue inspector") || r === "ri") return "Revenue Inspector";
    if (r.includes("village revenue officer") || r === "vro") return "Village Revenue Officer";
    if (r.includes("clerk")) return "Clerk";
    return role;
  };

  const selectedTappal = useMemo(
    () => myTappals.find((t) => t.tappalId === selectedTappalId),
    [myTappals, selectedTappalId]
  );

  const selectedOfficer = useMemo(
    () => officersBelow.find((o) => o.id === selectedOfficerId),
    [officersBelow, selectedOfficerId]
  );

  // ------------------ Forward Handler ------------------
  const handleForward = async () => {
    if (!selectedTappal || !selectedOfficer || !reason.trim()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select a tappal, officer and enter a reason.",
      });
      return;
    }

    const payload = {
      fromOfficerId: user?.id,
      fromOfficerName: user?.name,
      fromOfficerRole: user?.role,
      fromOfficerPhone: user?.phoneNumber,
      fromDepartment: user?.department,

      toOfficerId: selectedOfficer.id,
      toOfficerName: selectedOfficer.name,
      toOfficerRole: selectedOfficer.role,
      toOfficerPhone: selectedOfficer.phone,
      toDepartment: selectedOfficer.department,

      reason,
      forwardedBy: user?.id,
    };

    try {
      const response = await fetch(
        `https://eppkpabk61.execute-api.ap-southeast-1.amazonaws.com/dev/tapal/${encodeURIComponent(
          selectedTappal.tappalId
        )}/forward`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast({
          type: "error",
          title: "Error",
          message: data?.error || "Forwarding failed",
        });
        return;
      }

      showToast({
        type: "success",
        title: "Success",
        message: `${selectedTappal.tappalId} forwarded to ${selectedOfficer.name}`,
      });

      // Optimistic UI update
      setTappals((prev) =>
        prev.map((p) =>
          p.tappalId === selectedTappal.tappalId ? { ...p, status: "FORWARDED" } : p
        )
      );

      setSelectedTappalId("");
      setSelectedOfficerId("");
      setReason("");
    } catch (err) {
      console.error("Forward error:", err);
      showToast({
        type: "error",
        title: "Error",
        message: "Something went wrong!",
      });
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  // ===========================================================
  // =============== UI STARTS (WITH CARDS & TABLE) ============
  // ===========================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Forward Tappal</h1>
        <p className="text-gray-600">Forward tappals under your command</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600">Available to Forward</p>
          <p className="text-2xl font-bold text-green-600">{myTappals.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600">Officers Available</p>
          <p className="text-2xl font-bold text-blue-600">{officersBelow.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600">Pending Forwards</p>
          <p className="text-2xl font-bold text-orange-600">
            {myTappals.filter((t) => (t.status || "").toUpperCase() === "FORWARDED").length}
          </p>
        </div>
      </div>

      {/* Forward Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Forward Tappal</h2>

        {/* Select Tappal */}
        <label className="block text-sm font-medium mb-2">Select Tappal</label>
        <select
          value={selectedTappalId}
          onChange={(e) => setSelectedTappalId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Choose a tappal...</option>
          {myTappals.map((t) => (
            <option key={t.tappalId} value={t.tappalId}>
              {t.tappalId} - {t.subject}
            </option>
          ))}
        </select>

        {/* Select Officer */}
        <label className="block text-sm font-medium mt-4 mb-2">
          Forward to Officer
        </label>
        <select
          value={selectedOfficerId}
          onChange={(e) => setSelectedOfficerId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Choose an officer...</option>
          {officersBelow.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} - {getRoleDisplayName(o.role)}
            </option>
          ))}
        </select>

        {/* Reason */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border p-3 rounded mt-4"
          rows={4}
          placeholder="Enter reason..."
        />

        <button
          onClick={handleForward}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded"
        >
          Forward
        </button>
      </div>

      {/* Table of Available Tappals */}
      {myTappals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Your Available Tappals ({myTappals.length})
          </h2>

          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left w-[20%] font-semibold text-gray-700">ID</th>
                <th className="p-3 text-left w-[35%] font-semibold text-gray-700">Subject</th>
                <th className="p-3 text-left w-[15%] font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left w-[15%] font-semibold text-gray-700">Priority</th>
                <th className="p-3 text-left w-[15%] font-semibold text-gray-700">Action</th>
              </tr>
            </thead>

            <tbody>
              {myTappals.map((t) => (
                <tr key={t.tappalId} className="border-b hover:bg-gray-50">
                  
                  {/* 👇 CLICKABLE ID -> OPEN DETAIL PAGE */}
                  <td
                    className="p-3 text-blue-600 underline cursor-pointer"
                    onClick={() =>
                      navigate(`/tappal/${encodeURIComponent(t.tappalId)}`)
                    }
                  >
                    {t.tappalId}
                  </td>

                  <td className="p-3 text-gray-700">{t.subject}</td>
                  <td className="p-3 text-gray-700">{t.status}</td>
                  <td className="p-3 text-gray-700">{t.priority}</td>

                  <td className="p-3">
                    <button
                      onClick={() => setSelectedTappalId(t.tappalId)}
                      className="text-green-600"
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
