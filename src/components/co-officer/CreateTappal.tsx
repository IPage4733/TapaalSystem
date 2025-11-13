import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/ToastContainer";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  User,
  Phone,
  Building,
  Calendar,
  EyeOff,
  Save,
  X,
  Paperclip,
  UserPlus,
} from "lucide-react";
import { mockDepartments, mockPetitions } from '../../data/mockTappals';
import { mockUsers } from "../../data/mockUsers";

const API_LIST_PETITIONS =
  "https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition";
const API_GET_PETITION = (petitionId: string) =>
  `https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition/${encodeURIComponent(
    petitionId
  )}`;
const API_CREATE_TAPPAL =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";
const DEPTS_URL =
  "https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew";

// New: officers API endpoint provided by you
const OFFICERS_URL =
  "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

const CreateTappal: React.FC = () => {
    const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedPetition = searchParams.get("petition");

  const [formData, setFormData] = useState({
    petitionId: preSelectedPetition || "",
    petitionType: "",
    petitionerName: "",
    phoneNumber: "",
    email: "",
    aadharNumber: "",
    department: "",
    subject: "",
    description: "",
    isConfidential: false,
    expiryDate: "",
    assignedTo: "",
    priority: "Medium",
    attachments: [] as string[],
  });

  // petitions list fetched from API (for dropdown). fallback to mockPetitions.
  const [petitionsList, setPetitionsList] = useState<any[]>(mockPetitions);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // departments fetched from DEPTS_URL (fallback mockDepartments)
  const [departments, setDepartments] = useState<any[]>(mockDepartments);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // officers
  const [officers, setOfficers] = useState<any[]>([]); // normalized officer objects
  const [officersLoading, setOfficersLoading] = useState(false);
  const [officersError, setOfficersError] = useState<string | null>(null);

  // loading / error for fetching single petition details
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // ---------- fetch departments ----------
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const fetchDepts = async () => {
      setDeptLoading(true);
      setDeptError(null);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if ((user as any)?.token)
          headers["Authorization"] = `Bearer ${(user as any).token}`;

        const res = await fetch(DEPTS_URL, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Departments API returned ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data))
          throw new Error("Invalid departments response");
        // Map to expected shape: id and name
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.departmentName ?? d.department_name ?? d.departmentName,
        }));
        if (mounted) setDepartments(mapped);
      } catch (err: any) {
        console.error("Failed to fetch departments", err);
        if (mounted) {
          setDeptError(err?.message || "Failed to fetch departments");
          setDepartments(mockDepartments); // fallback
        }
      } finally {
        if (mounted) setDeptLoading(false);
      }
    };

    fetchDepts();
    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- fetch petitions list ----------
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const fetchList = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if ((user as any)?.token)
          headers["Authorization"] = `Bearer ${(user as any).token}`;

        const res = await fetch(API_LIST_PETITIONS, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`List API returned ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data))
          throw new Error("Invalid response format for petitions list");
        // Map API to UI shape (tolerant)
        const mapped = data.map((item: any) => ({
          id: item.petitionId ?? `${Math.random()}`,
          petitionId: item.petitionId ?? "",
          subject: item.subject ?? "",
          petitionerName: item.fullName ?? item.petitionerName ?? "",
          petitionerPhone: item.mobileNumber ?? item.petitionerPhone ?? "",
          petitionerEmail: item.email ?? item.petitionerEmail ?? "",
          department: item.departmentId ?? "",
          departmentName:
            mockDepartments.find((d: any) => d.id === item.departmentId)
              ?.name ||
            item.departmentName ||
            "",
          status:
            (item.status ?? "Pending") === "Pending"
              ? "Submitted"
              : item.status ?? "Submitted",
          isConfidential: !!item.confidential,
          createdAt: item.createdAt ?? new Date().toISOString(),
          tappalId: item.tappleId ?? item.tappalId ?? item.tappalID ?? "",
        }));
        if (mounted) setPetitionsList(mapped);
      } catch (err: any) {
        console.error("Failed to fetch petitions list", err);
        if (mounted) {
          setListError(err?.message || "Failed to fetch petitions");
          setPetitionsList(mockPetitions); // keep fallback
        }
      } finally {
        if (mounted) setListLoading(false);
      }
    };

    fetchList();
    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // ---------- fetch officers ----------
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchOfficers = async () => {
      setOfficersLoading(true);
      setOfficersError(null);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if ((user as any)?.token)
          headers["Authorization"] = `Bearer ${(user as any).token}`;

        const res = await fetch(OFFICERS_URL, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Officers API returned ${res.status}`);
        }
        const data = await res.json();

        // tolerate shapes: may have { success, officers: [...] } or array directly
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.officers)
          ? data.officers
          : [];

        // Normalize each officer to { id, name, role, department }
        const normalized = rawList.map((o: any) => {
          const name =
            o.fullName ?? o.name ?? o.employeeName ?? o.full_name ?? "Unknown";
          const role = (o.role ?? o.description ?? "Officer").toString();
          const department =
            o.department ??
            o.departmentName ??
            o.department_name ??
            o.dept ??
            (o.description && o.description.includes("Admin") ? "Administration" : "") ??
            "";
          const id = o.id ?? o.employeeId ?? o.employee_id ?? o._id ?? name;
          return {
            raw: o,
            id,
            name,
            role,
            department,
            email: o.email ?? "",
            phone: o.phone ?? o.mobile ?? "",
          };
        });

        if (mounted) setOfficers(normalized);
      } catch (err: any) {
        console.error("Failed to fetch officers", err);
        if (mounted) {
          setOfficersError(err?.message || "Failed to fetch officers");
          // leave officers as empty — UI will still show dummy/mockUsers
        }
      } finally {
        if (mounted) setOfficersLoading(false);
      }
    };

    fetchOfficers();
    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a petition is selected (either from dropdown or preSelected), fetch its details and prefill
  useEffect(() => {
    if (!formData.petitionId) return;

    let mounted = true;
    const controller = new AbortController();

    const fetchDetails = async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if ((user as any)?.token)
          headers["Authorization"] = `Bearer ${(user as any).token}`;

        const res = await fetch(API_GET_PETITION(formData.petitionId), {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Detail API returned ${res.status}`);
        }
        const item = await res.json();
        // Some APIs wrap object in data or return object directly — be tolerant
        const payload = item?.data ?? item;

        if (!payload) throw new Error("Empty petition details");

        // Map API fields to your form fields (tolerant to different naming)
        const mappedPetition = {
          petitionType: payload.petitionType,
          petitionerName:
            payload.fullName ??
            payload.petitionerName ??
            formData.petitionerName,
          phoneNumber:
            payload.mobileNumber ??
            payload.petitionerPhone ??
            formData.phoneNumber,
          email: payload.email ?? payload.petitionerEmail ?? formData.email,
          aadharNumber:
            payload.aadharNumber ??
            payload.adharNumber ??
            formData.aadharNumber,
          department:
            payload.departmentId ?? payload.department ?? formData.department,
          subject: payload.subject ?? formData.subject,
          description: payload.description ?? formData.description,
          isConfidential:
            typeof payload.confidential !== "undefined"
              ? !!payload.confidential
              : !!payload.isConfidential,
        };

        // Update only the pre-fillable fields — don't overwrite expiry/assigned/priority/attachments unintentionally
        if (mounted) {
          setFormData((prev) => ({
            ...prev,
            ...mappedPetition,
          }));
        }
      } catch (err: any) {
        console.error("Failed to fetch petition details", err);
        if (mounted) {
          setDetailError(err?.message || "Failed to fetch petition details");
          showToast?.({
            type: "error",
            title: "Failed to load petition details",
            message: err?.message || "Check network or petition id",
          });
        }
      } finally {
        if (mounted) setDetailLoading(false);
      }
    };

    fetchDetails();
    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.petitionId]); // whenever petitionId changes

  // ---------- Dummy officers (simple local list) ----------
  const dummyOfficers = [
    {
      id: "OFF-1001",
      name: "A. Kumar",
      role: "clerk",
      department: "Development Office",
    },
    {
      id: "OFF-1002",
      name: "B. Sharma",
      role: "vro",
      department: "Revenue Department",
    },
    {
      id: "OFF-1003",
      name: "C. Reddy",
      role: "ri",
      department: "Development Office",
    },
  ];

  // availableOfficers: dummy first + mockUsers (excluding co_officer) + fetched officers
  const availableOfficers = useMemo(() => {
    const mappedMockUsers = mockUsers
      .filter((u) => u.role !== "co_officer")
      .map((u) => ({
        id: u.id ?? u.employeeId ?? u.email ?? u.name ?? `${u.fullName ?? "user"}`,
        name: u.fullName ?? u.name ?? u.email ?? "Unknown",
        role: u.role ?? "Officer",
        department: u.department ?? u.office ?? "",
      }));

    const mappedFetched = officers.map((o) => ({
      id: o.id,
      name: o.name,
      role: o.role,
      department: o.department || "",
      email: o.email || "",
      phone: o.phone || "",
    }));

    // avoid duplicates by id (prefer fetched officers), build map
    const map = new Map<string, any>();
    [...dummyOfficers, ...mappedMockUsers, ...mappedFetched].forEach((off: any) => {
      if (!map.has(off.id)) map.set(off.id, off);
    });
    return Array.from(map.values());
  }, [officers]);

  // Filter officers by selected department name
  const selectedDepartmentName =
    departments.find((d) => d.id === formData.department)?.name || "";
  const departmentOfficers = availableOfficers.filter(
    (officer) =>
      !formData.department ||
      (officer.department || "")
        .toString()
        .toLowerCase()
        .includes(selectedDepartmentName.toLowerCase()) ||
      (officer.department || "")
        .toString()
        .toLowerCase()
        .includes((formData.department || "").toLowerCase()) ||
      // also allow matching by officer name/role if department is blank
      selectedDepartmentName === "" 
  );

  const petitionTypes = [
    "Land Revenue",
    "Property Tax",
    "Birth Certificate",
    "Death Certificate",
    "Income Certificate",
    "Caste Certificate",
    "Residence Certificate",
    "Water Connection",
    "Building Permission",
    "Road Construction",
    "Drainage Issues",
    "Electricity Connection",
    "Other",
  ];

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map((file) => file.name);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...fileNames],
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // helper: update petition record via PUT to API_GET_PETITION(petitionId)
const updatePetitionWithTappal = async (petitionId: string, tappalId: string) => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if ((user as any)?.token) headers["Authorization"] = `Bearer ${(user as any).token}`;

    // GET existing to preserve fields we don't have in form
    const getRes = await fetch(API_GET_PETITION(petitionId), { method: "GET", headers });
    let existing: any = {};
    try {
      const json = await getRes.json();
      existing = json?.data ?? json ?? {};
    } catch {
      existing = {};
    }

    // pick values ensuring required fields exist per your Lambda
    const fullName = formData.petitionerName || existing.fullName || existing.petitionerName || "";
    const subject = formData.subject || existing.subject || "";
    const petitionType = formData.petitionType || existing.petitionType || "General";
    const mobileNumber = formData.phoneNumber || existing.mobileNumber || existing.petitionerPhone || "";
    const status = "Tappal Generated";
    // Lambda expects dueDate (ISO) and will validate presence
    const dueDate = formData.expiryDate
      ? new Date(formData.expiryDate).toISOString()
      : existing.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // fallback if missing

    const aadharNumber = formData.aadharNumber || existing.aadharNumber || existing.adharNumber || "";
    const address = existing.address || "";
    const departmentId = formData.department || existing.departmentId || existing.department || "";
    const departmentName =
      departments.find((d) => d.id === departmentId)?.name ||
      existing.departmentName ||
      "";

    // assigned officer info
    const assignedOfficer = availableOfficers.find((o) => o.id === formData.assignedTo);
    const assignedTo = formData.assignedTo || existing.assignedTo || "";
    const assignedToName = assignedOfficer?.name || existing.assignedToName || "";

    const item = {
      petitionId, // path key must match
      petitionType,
      subject,
      description: formData.description || existing.description || "",
      fullName,
      mobileNumber,
      aadharNumber,
      address,
      departmentId,
      departmentName,
      attachments: formData.attachments.length ? formData.attachments : existing.attachments || [],
      status,
      createdAt: existing.createdAt || new Date().toISOString(),
      dueDate,
      confidential: !!formData.isConfidential,
      // IMPORTANT: your Lambda writes tappleId field — use that exact name
      tappleId: tappalId,
      // also include these so tappal and petition remain in sync
      assignedTo,
      assignedToName,
    };

    // Send full PUT (Lambda expects full update)
    const putRes = await fetch(API_GET_PETITION(petitionId), {
      method: "PUT",
      headers,
      body: JSON.stringify(item),
    });

    if (!putRes.ok) {
      let errText = `PUT returned ${putRes.status}`;
      try {
        const errBody = await putRes.json();
        errText = errBody?.message || JSON.stringify(errBody);
      } catch {}
      throw new Error(errText);
    }

    // Verify the update by fetching again
    const verifyRes = await fetch(API_GET_PETITION(petitionId), { method: "GET", headers });
    let verifyJson: any = {};
    try {
      const vj = await verifyRes.json();
      verifyJson = vj?.data ?? vj ?? {};
    } catch {}
    const written = verifyJson?.tappleId ?? verifyJson?.tappalId ?? verifyJson?.tappal_id ?? null;

    if (!written || written !== tappalId) {
      console.warn("Verification mismatch:", written, "expected:", tappalId, "verifyJson:", verifyJson);
      showToast?.({
        type: "warning",
        title: "Petition updated but tappal id mismatch",
        message: written ? `Server stored ${written} but expected ${tappalId}` : "Server did not return tappal id after update",
        duration: 8000,
      });
    } else {
      showToast?.({
        type: "success",
        title: "Petition updated",
        message: `Petition ${petitionId} updated with tappal ${tappalId}.`,
      });
    }
  } catch (err: any) {
    console.error("Failed to update petition with tappal:", err);
    showToast?.({
      type: "error",
      title: "Failed to update petition",
      message: err?.message || "Petition update failed",
    });
  }
};



  // POST create tappal (same as previous implementation) + update petition if linked
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.petitionerName ||
      !formData.phoneNumber ||
      !formData.department ||
      !formData.subject ||
      !formData.description ||
      !formData.expiryDate ||
      !formData.assignedTo
    ) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    // Resolve assignedToName from availableOfficers (fallback empty string)
    const assignedOfficer = availableOfficers.find((o) => o.id === formData.assignedTo);
    const assignedToName = assignedOfficer?.name || "";

    // Resolve createdBy from user context (try several fallbacks)
    const createdBy =
      (user as any)?.fullName ||
      (user as any)?.name ||
      (user as any)?.email ||
      (user as any)?.id ||
      "";

    const payload = {
      petitionId: formData.petitionId || undefined,
      petitionType: formData.petitionType || "General",
      petitionerName: formData.petitionerName,
      phoneNumber: formData.phoneNumber,
      adharNumber: formData.aadharNumber || undefined,
      email: formData.email || undefined,
      department:
        departments.find((d) => d.id === formData.department)?.name ||
        mockDepartments.find((d) => d.id === formData.department)?.name ||
        formData.department,
      assignToOfficer: formData.assignedTo,
      assignedTo: formData.assignedTo, // include assignedTo explicitly
      assignedToName, // include human name for backend
      createdBy, // who created this tappal
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      expiryDate: formData.expiryDate,
      confidential: !!formData.isConfidential,
      attachDocuments: formData.attachments.length ? formData.attachments : [],
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if ((user as any)?.token)
        headers["Authorization"] = `Bearer ${(user as any).token}`;

      const res = await fetch(API_CREATE_TAPPAL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorText = `API returned ${res.status}`;
        try {
          const errBody = await res.json();
          errorText = errBody?.message || JSON.stringify(errBody);
        } catch {}
        throw new Error(errorText);
      }

      let responseBody: any = null;
      try {
        responseBody = await res.json();
      } catch {
        responseBody = null;
      }

      // Helpful debug during development
      console.debug("Create tappal response:", responseBody);

      // Prefer server-provided tappal id (check common fields)
      const serverTappalId =
        responseBody?.tappalId ??
        responseBody?.tappleId ??
        responseBody?.tappal_id ??
        responseBody?.tappalID ??
        responseBody?.id ??
        responseBody?.tappal?.tappalId ??
        responseBody?.tappal?.tappleId ??
        null;

      if (!serverTappalId) {
        // Server didn't return the created tappal id — abort linking & navigation
        showToast?.({
          type: "error",
          title: "Missing tappal id",
          message:
            "Server did not return the created tappal id. Petition was not linked. Check server response.",
        });
        return;
      }

      const tappalId = serverTappalId;

      showToast({
        type: "success",
        title: "Tappal Created Successfully!",
        message: `Tappal ${tappalId} created and assigned.`,
        duration: 5000,
      });

      // Update the petition if linked (this will call your PUT and include assignedTo info)
      if (formData.petitionId) {
        await updatePetitionWithTappal(formData.petitionId, tappalId);
      }

      // Reset form (keep behavior same)
      setFormData({
        petitionId: "",
        petitionType: "",
        petitionerName: "",
        phoneNumber: "",
        email: "",
        aadharNumber: "",
        department: "",
        subject: "",
        description: "",
        isConfidential: false,
        expiryDate: "",
        assignedTo: "",
        priority: "Medium",
        attachments: [],
      });

      // Navigate to tappal detail page — use the server-authoritative id
      try {
        navigate(`/tappal/${encodeURIComponent(tappalId)}`);
      } catch (navErr) {
        console.warn("Navigation to tappal detail failed:", navErr);
      }
    } catch (err: any) {
      console.error("Create tappal failed:", err);
      showToast?.({
        type: "error",
        title: "Failed to create tappal",
        message: err?.message || "Check network, CORS or API errors",
      });
    }
  };


  const handleClear = () => {
    setFormData({
      petitionId: "",
      petitionType: "",
      petitionerName: "",
      phoneNumber: "",
      email: "",
      aadharNumber: "",
      department: "",
      subject: "",
      description: "",
      isConfidential: false,
      expiryDate: "",
      assignedTo: "",
      priority: "Medium",
      attachments: [],
    });
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      collector: "District Collector",
      joint_collector: "Joint Collector",
      dro: "District Revenue Officer",
      rdo: "Revenue Divisional Officer",
      tahsildar: "Tahsildar",
      naib_tahsildar: "Naib Tahsildar",
      ri: "Revenue Inspector",
      vro: "Village Revenue Officer",
      clerk: "Clerk",
    };
    return roleNames[role.toLowerCase()] || role;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <Plus className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Tappal
            </h1>
            <p className="text-gray-600">
              Create a trackable tappal from citizen petition or new request
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="space-y-6">
          {/* Petition Link (Optional) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Link to Existing Petition (Optional)
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Petition ID (Optional)
              </label>
              <select
                value={formData.petitionId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    petitionId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">
                  Create new tappal without linking to petition
                </option>
                {petitionsList
                  .filter((p) => !p.tappalId)
                  .map((petition) => (
                    <option key={petition.id} value={petition.petitionId}>
                      {petition.petitionId} - {petition.subject} (
                      {petition.petitionerName})
                    </option>
                  ))}
              </select>

              {detailLoading && (
                <p className="text-sm text-gray-500 mt-2">
                  Loading petition details...
                </p>
              )}
              {detailError && (
                <p className="text-sm text-red-500 mt-2">
                  Failed to load petition details: {detailError}
                </p>
              )}

              {/* Show a small summary if selected petition exists in list */}
              {formData.petitionId &&
                petitionsList.find(
                  (p) => p.petitionId === formData.petitionId
                ) && (
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Linked Petition:</strong>{" "}
                      {
                        petitionsList.find(
                          (p) => p.petitionId === formData.petitionId
                        )?.subject
                      }{" "}
                      by{" "}
                      {
                        petitionsList.find(
                          (p) => p.petitionId === formData.petitionId
                        )?.petitionerName
                      }
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Petitioner Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Petitioner Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Petition Type
                </label>
                <select
                  value={formData.petitionType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      petitionType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select petition type...</option>
                  {petitionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Petitioner's Name *
                </label>
                <input
                  type="text"
                  value={formData.petitionerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      petitionerName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter petitioner's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhar Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      aadharNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1234 5678 9012"
                />
              </div>
            </div>
          </div>

          {/* Tappal Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tappal Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                      assignedTo: "",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">
                    {deptLoading
                      ? "Loading departments..."
                      : "Select department..."}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {deptError && (
                  <p className="text-xs text-red-500 mt-1">
                    Failed to load departments: {deptError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief subject of the petition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Detailed description of the petition and required action"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Officer *
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">
                      {officersLoading ? "Loading officers..." : "Select officer..."}
                    </option>
                    {departmentOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} - {getRoleDisplayName(officer.role)} (
                        {officer.department || "Dept"})
                      </option>
                    ))}
                  </select>
                  {officersError && (
                    <p className="text-xs text-red-500 mt-1">
                      Failed to load officers: {officersError}
                    </p>
                  )}
                </div>
              </div>

              {/* Confidential Toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isConfidential}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isConfidential: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center space-x-1">
                    <EyeOff className="h-4 w-4" />
                    <span>Mark as Confidential</span>
                  </span>
                </label>
                <span className="text-xs text-gray-500">
                  (Visible only to you and Collector)
                </span>
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              File Attachments
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
              </div>

              {/* Display attached files */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Attached Files:
                  </p>
                  <div className="space-y-1">
                    {formData.attachments.map((fileName, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {fileName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create & Assign Tappal</span>
            </button>
          </div>
        </div>
      </form>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <FileText className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-purple-800 mb-2">
              Tappal Creation Guidelines
            </h3>
            <div className="text-purple-700 space-y-1">
              <p>
                • <strong>Petition Linking:</strong> Optionally link to existing
                petitions or create standalone tappals
              </p>
              <p>
                • <strong>Officer Assignment:</strong> Select appropriate
                officer based on department and expertise
              </p>
              <p>
                • <strong>Confidential Marking:</strong> Use for sensitive
                matters (visible only to you and Collector)
              </p>
              <p>
                • <strong>Priority Setting:</strong> Set appropriate priority
                based on urgency and importance
              </p>
              <p>
                • <strong>File Attachments:</strong> Include all relevant
                documents and supporting materials
              </p>
              <p>
                • <strong>Expiry Date:</strong> Set realistic deadlines
                considering complexity and workload
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTappal;
