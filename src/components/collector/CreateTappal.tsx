import React, { useEffect, useMemo, useState } from "react";
import { Plus, FileText, EyeOff, X, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/ToastContainer";

/* ================= APIs ================= */

const PETITIONS_API =
  "https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition";

const DEPARTMENTS_API =
  "https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew";

const OFFICERS_API =
  "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

const CREATE_TAPPAL_API =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

const UPLOAD_API =
  "https://plcqzpx1rb.execute-api.ap-southeast-1.amazonaws.com/dev/petitions/upload-url";

/* ================= COMPONENT ================= */

const CreateTappal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [petitions, setPetitions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    petitionId: "",
    petitionType: "",
    petitionerName: "",
    phoneNumber: "",
    email: "",
    aadharNumber: "",
    department: "",
    subject: "",
    description: "",
    priority: "Medium",
    expiryDate: "",
    assignedTo: "",
    isConfidential: false,
    attachments: [] as File[],
  });

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    fetch(PETITIONS_API)
      .then((r) => r.json())
      .then((d) => setPetitions(Array.isArray(d) ? d : []));

    fetch(DEPARTMENTS_API)
      .then((r) => r.json())
      .then((d) =>
        setDepartments(
          Array.isArray(d)
            ? d.map((x: any) => ({ id: x.id, name: x.departmentName }))
            : []
        )
      );

    fetch(OFFICERS_API)
      .then((r) => r.json())
      .then((d) => setOfficers(d.officers || []));
  }, []);

  /* ================= DERIVED ================= */

  const selectedDeptName =
    departments.find((d) => d.id === formData.department)?.name || "";

  const departmentOfficers = useMemo(() => {
    return officers.filter((o: any) =>
      (o.department || "")
        .toLowerCase()
        .includes(selectedDeptName.toLowerCase())
    );
  }, [officers, selectedDeptName]);

  /* ================= HANDLERS ================= */

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFormData((p) => ({
      ...p,
      attachments: [...p.attachments, ...Array.from(e.target.files)],
    }));
  };

  const removeAttachment = (i: number) => {
    setFormData((p) => ({
      ...p,
      attachments: p.attachments.filter((_, idx) => idx !== i),
    }));
  };

  /* ================= FILE UPLOAD ================= */

  const uploadSingleFile = async (file: File) => {
    const res = await fetch(UPLOAD_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!res.ok) throw new Error("Signed URL error");

    const { uploadUrl, fileUrl, key } = await res.json();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!putRes.ok) throw new Error("S3 upload failed");

    return { fileName: file.name, fileType: file.type, fileUrl, key };
  };

  /* ================= SUBMIT ================= */

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
        message: "Please fill all required fields",
      });
      return;
    }

    try {
      const uploadedFiles = await Promise.all(
        formData.attachments.map(uploadSingleFile)
      );

      const officer = officers.find(
        (o: any) => o.id === formData.assignedTo
      );

      const payload = {
        petitionId: formData.petitionId || undefined,
        petitionType: formData.petitionType,
        petitionerName: formData.petitionerName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        aadharNumber: formData.aadharNumber,
        department: selectedDeptName,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        expiryDate: formData.expiryDate,
        isConfidential: formData.isConfidential,
        assignedTo: formData.assignedTo,
        assignedToName: officer?.name || "",
        assignedToRole: officer?.role || officer?.designation || "",
        createdBy: user?.email || "collector",
        attachments: uploadedFiles,
      };

      const res = await fetch(CREATE_TAPPAL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Create failed");

      showToast({
        type: "success",
        title: "Success",
        message: "Tappal created & file saved successfully",
      });

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
        priority: "Medium",
        expiryDate: "",
        assignedTo: "",
        isConfidential: false,
        attachments: [],
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Error",
        message: err.message || "Failed to create tappal",
      });
    }
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Plus className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Create New Tappal</h1>
            <p className="text-gray-600">
              Create a trackable tappal from citizen petition or new request
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">

          <select name="petitionId" value={formData.petitionId} onChange={handleChange}
            className="w-full border rounded px-3 py-2">
            <option value="">Create new tappal without linking to petition</option>
            {petitions.map((p: any) => (
              <option key={p.petitionId} value={p.petitionId}>
                {p.petitionId} – {p.subject}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <select name="petitionType" value={formData.petitionType}
              onChange={handleChange} className="border rounded px-3 py-2">
              <option value="">Select petition type</option>
              <option>Land Revenue</option>
              <option>Income Certificate</option>
              <option>Caste Certificate</option>
              <option>Residence Certificate</option>
            </select>

            <input name="petitionerName" value={formData.petitionerName}
              onChange={handleChange} placeholder="Petitioner's Name"
              className="border rounded px-3 py-2" />

            <input name="phoneNumber" value={formData.phoneNumber}
              onChange={handleChange} placeholder="Phone Number"
              className="border rounded px-3 py-2" />

            <input name="email" value={formData.email}
              onChange={handleChange} placeholder="Email Address"
              className="border rounded px-3 py-2" />

            <input name="aadharNumber" value={formData.aadharNumber}
              onChange={handleChange} placeholder="Aadhar Number (Optional)"
              className="border rounded px-3 py-2 col-span-2" />
          </div>

          <select name="department" value={formData.department}
            onChange={handleChange} className="border rounded px-3 py-2 w-full">
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <input name="subject" value={formData.subject}
            onChange={handleChange} placeholder="Subject"
            className="border rounded px-3 py-2 w-full" />

          <textarea name="description" value={formData.description}
            onChange={handleChange} rows={4}
            placeholder="Detailed description of the petition and required action"
            className="border rounded px-3 py-2 w-full" />

          <div className="grid grid-cols-3 gap-4">
            <select name="priority" value={formData.priority}
              onChange={handleChange} className="border rounded px-3 py-2">
              <option>Low</option><option>Medium</option><option>High</option>
            </select>

            <input type="date" name="expiryDate"
              value={formData.expiryDate} onChange={handleChange}
              className="border rounded px-3 py-2" />

            <select name="assignedTo" value={formData.assignedTo}
              onChange={handleChange} className="border rounded px-3 py-2">
              <option value="">Select officer</option>
              {departmentOfficers.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name} – {o.role || o.designation}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isConfidential"
              checked={formData.isConfidential} onChange={handleChange} />
            <EyeOff className="h-4 w-4" />
            Mark as Confidential
          </label>

          <div>
            <input type="file" multiple onChange={handleFileUpload} />
            {formData.attachments.map((f, i) => (
              <div key={i} className="flex justify-between text-sm mt-1">
                {f.name}
                <button type="button" onClick={() => removeAttachment(i)}>
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button type="reset" className="border px-4 py-2 rounded">
              Clear Form
            </button>
            <button type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create & Assign Tappal
            </button>
          </div>

        </div>
      </form>

      <div className="bg-blue-50 border rounded-xl p-6">
        <div className="flex gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div className="text-blue-700 text-sm space-y-1">
            <p>• Select appropriate officer based on department</p>
            <p>• Use confidential marking carefully</p>
            <p>• Attach all required supporting documents</p>
            <p>• Set realistic expiry dates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTappal;
