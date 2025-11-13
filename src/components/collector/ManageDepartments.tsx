import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Mail,
  User,
  MapPin,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { mockTappals } from "../../data/mockTappals";
import { Department } from "../../types/Tappal";
import statesJson from "../../data/states-districts.json";
import { useToast } from "../common/ToastContainer";

/**
 * ManageDepartments.api.tsx
 * - Replaces local mockDepartments usage with real API calls.
 * - Configure API_BASE below (e.g. "https://aws.com/department").
 *
 * Endpoints expected by this file (based on your provided API):
 * GET    ${API_BASE}            -> list all departments
 * POST   ${API_BASE}            -> create department (body: departmentName, departmentCode, district, state, contactEmail, headOfDepartment)
 * GET    ${API_BASE}/{id}       -> get department by id
 * PUT    ${API_BASE}/{id}       -> update department (same body as POST)
 * DELETE ${API_BASE}/{id}       -> delete department
 */

// *** SET THIS to your API base (no trailing slash). Example: 'https://aws.com/department' ***
const API_BASE =
  "https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew";

type ApiDept = {
  id?: string;
  _id?: string;
  departmentName?: string;
  departmentCode?: string;
  district?: string;
  state?: string;
  contactEmail?: string;
  headOfDepartment?: string;
  createdAt?: string;
  isActive?: boolean;
};

type DeptFormData = Partial<Department & { state?: string }>;

const ManageDepartments: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightDepartmentId = searchParams.get("highlight");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<DeptFormData>({
    name: "",
    code: "",
    state: "",
    district: "",
    contactEmail: "",
    headOfDepartment: "",
  });

  const statesData: { state: string; districts: string[] }[] =
    (statesJson as any) || [];

  // helper: normalise API department -> local Department type
  const normalizeFromApi = (a: ApiDept): Department => {
    const id = a.id || a._id || String(Math.random());
    return {
      id,
      name: a.departmentName || "",
      code: a.departmentCode || "",
      district: a.district || "",
      contactEmail: a.contactEmail || "",
      headOfDepartment: a.headOfDepartment || "",
      createdAt: a.createdAt || new Date().toISOString(),
      isActive: typeof a.isActive === "boolean" ? a.isActive : true,
    } as Department;
  };

  // FETCH: load all departments
  const fetchDepartments = async () => {
    if (!API_BASE) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { method: "GET" });
      if (!res.ok)
        throw new Error(`Failed to fetch departments: ${res.status}`);
      const json = await res.json();
      // assume API returns array; if it returns { data: [...] } adapt accordingly
      const list: ApiDept[] = Array.isArray(json) ? json : json.data || [];
      setDepartments(list.map(normalizeFromApi));
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Load Failed",
        message: "Could not load departments from API.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      state: "",
      district: "",
      contactEmail: "",
      headOfDepartment: "",
    });
  };

  // When editing, optionally fetch latest by id from API for freshest data
  const handleEdit = async (department: Department & { state?: string }) => {
    setIsAddingNew(false);
    setEditingId(department.id);
    // attempt to fetch by id if API configured
    if (API_BASE) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/${department.id}`, {
          method: "GET",
        });
        if (res.ok) {
          const json = await res.json();
          const apiDept: ApiDept = Array.isArray(json) ? json[0] : json;
          const normalized = normalizeFromApi(apiDept);
          setFormData({
            name: normalized.name,
            code: normalized.code,
            state: (apiDept.state as string) || "",
            district: normalized.district,
            contactEmail: normalized.contactEmail,
            headOfDepartment: normalized.headOfDepartment,
          });
        } else {
          // fallback to provided data
          setFormData({
            name: department.name,
            code: department.code,
            state: (department as any).state || "",
            district: department.district || "",
            contactEmail: department.contactEmail,
            headOfDepartment: department.headOfDepartment,
          });
        }
      } catch (err) {
        console.error(err);
        setFormData({
          name: department.name,
          code: department.code,
          state: (department as any).state || "",
          district: department.district || "",
          contactEmail: department.contactEmail,
          headOfDepartment: department.headOfDepartment,
        });
      } finally {
        setLoading(false);
      }
    } else {
      // no API configured - use local data
      setFormData({
        name: department.name,
        code: department.code,
        state: (department as any).state || "",
        district: department.district || "",
        contactEmail: department.contactEmail,
        headOfDepartment: department.headOfDepartment,
      });
    }
  };

  const handleSave = async () => {
    // local validation
    if (
      !formData.name ||
      !formData.code ||
      !formData.contactEmail ||
      !formData.headOfDepartment
    ) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields.",
      });
      return;
    }
    if (!formData.state || !formData.district) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select both State and District.",
      });
      return;
    }

    const payload = {
      departmentName: formData.name,
      departmentCode: formData.code,
      district: formData.district,
      state: formData.state,
      contactEmail: formData.contactEmail,
      headOfDepartment: formData.headOfDepartment,
    };

    try {
      setLoading(true);
      if (isAddingNew) {
        if (!API_BASE) throw new Error("API_BASE not configured");
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // try to extract any server error text for clarity
          const errText = await res.text().catch(() => "");
          throw new Error(`Create failed: ${res.status} ${errText}`);
        }

        // We don't trust the POST response structure — just re-fetch authoritative list
        await fetchDepartments();

        showToast({
          type: "success",
          title: "Department Created",
          message: "Created successfully.",
        });
      } else if (editingId) {
        if (!API_BASE) throw new Error("API_BASE not configured");
        const res = await fetch(`${API_BASE}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);

        // try parse response
        let updatedApi: any = null;
        try {
          updatedApi = await res.json();
        } catch (e) {
          updatedApi = null;
        }

        console.log("PUT response:", updatedApi);

        const looksLikeDept =
          updatedApi &&
          (updatedApi.departmentName ||
            updatedApi.departmentCode ||
            updatedApi.id ||
            updatedApi._id);
        if (looksLikeDept) {
          const normalized = normalizeFromApi(
            Array.isArray(updatedApi) ? updatedApi[0] : updatedApi
          );
          setDepartments((prev) =>
            prev.map((d) => (d.id === editingId ? normalized : d))
          );
        } else {
          // server didn't return the updated object -> re-fetch authoritative list
          await fetchDepartments();
        }

        showToast({
          type: "success",
          title: "Department Updated",
          message: "Updated successfully.",
        });
      }

      handleCancel();
    } catch (err) {
      console.error("handleSave error", err);
      showToast({
        type: "error",
        title: "Save Failed",
        message: "An error occurred while saving.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      state: "",
      district: "",
      contactEmail: "",
      headOfDepartment: "",
    });
  };

  const getDepartmentTappalCount = (departmentId: string) => {
    return mockTappals.filter((tappal) => tappal.department === departmentId)
      .length;
  };

  const handleDelete = async (departmentId: string) => {
    const hasTappals = mockTappals.some(
      (tappal) => tappal.department === departmentId
    );
    if (hasTappals) {
      showToast({
        type: "error",
        title: "Delete Blocked",
        message:
          "Cannot delete department — there are existing tappals assigned to it.",
      });
      return;
    }


    try {
      setLoading(true);
      if (!API_BASE) throw new Error("API_BASE not configured");
      const res = await fetch(`${API_BASE}/${departmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setDepartments((prev) => prev.filter((d) => d.id !== departmentId));
      showToast({
        type: "success",
        title: "Department Deleted",
        message: "Department has been deleted.",
      });
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: "Could not delete the department.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedStateEntry = statesData.find((s) => s.state === formData.state);
  const availableDistricts = selectedStateEntry
    ? selectedStateEntry.districts
    : [];

  const handleStateSelect = (stateName: string) => {
    setFormData((prev) => ({ ...prev, state: stateName, district: "" }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Departments
              </h1>
              <p className="text-gray-600">
                Add, edit, and manage department information
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isAddingNew ? "Add New Department" : "Edit Department"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                value={formData.code || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department code (e.g., REV)"
                disabled={loading}
              />
            </div>

            {/* State dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <select
                value={formData.state || ""}
                onChange={(e) => handleStateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select state</option>
                {statesData.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>

            {/* District dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                value={formData.district || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, district: e.target.value }))
                }
                disabled={!formData.state || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              >
                <option value="">
                  {formData.state ? "Select district" : "Select state first"}
                </option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact email"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Head of Department *
              </label>
              <input
                type="text"
                value={formData.headOfDepartment || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    headOfDepartment: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter head of department name"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Departments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Departments ({departments.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Head of Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State / District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tappals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((department) => {
                const tappalCount = getDepartmentTappalCount(department.id);
                const canDelete = tappalCount === 0;

                return (
                  <tr
                    key={department.id}
                    className={`hover:bg-gray-50 ${
                      highlightDepartmentId === department.id
                        ? "bg-yellow-50 border-l-4 border-yellow-400"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {department.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created:{" "}
                            {new Date(
                              department.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                        {department.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {department.headOfDepartment}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {department.contactEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {(department as any).state
                            ? `${(department as any).state} / ${
                                department.district
                              }`
                            : department.district}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">
                        {tappalCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          department.isActive
                            ? "text-green-600 bg-green-100"
                            : "text-red-600 bg-red-100"
                        }`}
                      >
                        {department.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(department as any)}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-60"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(department.id)}
                          disabled={!canDelete || loading}
                          className={`inline-flex items-center px-3 py-1 border rounded-lg text-xs font-medium transition-colors ${
                            canDelete
                              ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                              : "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                          } disabled:opacity-60`}
                          title={
                            !canDelete
                              ? "Cannot delete: Department has existing tappals"
                              : "Delete department"
                          }
                        >
                          {!canDelete && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No departments found
            </h3>
            <p className="text-gray-500">
              Add your first department to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDepartments;
