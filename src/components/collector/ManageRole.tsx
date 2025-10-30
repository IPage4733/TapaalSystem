// src/components/admin/ManageRole.tsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  UserPlus,
  CheckSquare,
  X,
  Save,
  Settings,
  Building,
} from "lucide-react";
import statesJson from "../../data/states-districts.json";
import { useToast } from "../common/ToastContainer";

/**
 * API-backed ManageRole (wired to your real API)
 *
 * IMPORTANT:
 * - GET expects response: { success: true, count: X, roles: [...] }
 * - Each role object uses fields like roleId, roleName, shortDescription, state, district, permissions, createdAt
 * - PUT payload must include roleId
 */

// -----------------------------
// CONFIG - change these to your real endpoints
// -----------------------------
const API_BASE_GET =
  "https://2drqpw0tig.execute-api.ap-southeast-1.amazonaws.com/prod/roles"; // GET list, GET by id (${API_BASE_GET}/{id}), DELETE (${API_BASE_GET}/{id})
const API_BASE_POST =
  "https://ijka64k94f.execute-api.ap-southeast-1.amazonaws.com/dev/roles"; // POST create
const API_BASE_PUT =
  "https://izldctv559.execute-api.ap-southeast-1.amazonaws.com/dev/roles"; // PUT update

// Optional auth token (leave empty for none)
const AUTH_TOKEN = ""; // e.g. "eyJhbGciOiJI..." or ""

type PermissionKey = string;

interface Role {
  id: string; // mapped from roleId (server)
  name: string; // mapped from roleName
  description?: string; // mapped from shortDescription or description
  state?: string;
  district?: string;
  permissions: PermissionKey[];
  createdAt: string;
  builtIn?: boolean;
}

// Local states type
type StateEntry = { state: string; districts: string[] };
const LOCAL_STATES: StateEntry[] = statesJson as unknown as StateEntry[];

// UI permission metadata (you can expand)
const PERMISSIONS: { key: PermissionKey; label: string; hint?: string }[] = [
  {
    key: "view_petitions",
    label: "View Petitions",
    hint: "See all petitions & tappals",
  },
  {
    key: "create_tappal",
    label: "Create Tappal",
    hint: "Convert petitions into tappals",
  },
  {
    key: "forward_tappal",
    label: "Forward Tappal",
    hint: "Send tappal to another officer",
  },
  {
    key: "manage_officers",
    label: "Manage Officers",
    hint: "Create / edit officer accounts",
  },
  {
    key: "view_analytics",
    label: "View Analytics",
    hint: "Access dashboards & reports",
  },
  {
    key: "manage_settings",
    label: "Manage Settings",
    hint: "System configuration",
  },
];

const uid = (base = "role") =>
  `${base}-${Math.random().toString(36).slice(2, 9)}`;

// normalize server role -> local Role
const normalizeRole = (r: any): Role => {
  const id = r.roleId || r.id || r._id || uid("role");
  return {
    id,
    name: r.roleName || r.name || "Unnamed role",
    description: r.shortDescription || r.description || "",
    state: r.state || "",
    district: r.district || "",
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
    createdAt: r.createdAt || new Date().toISOString(),
    builtIn: !!r.builtIn,
  };
};

// build headers (including optional auth)
const buildHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  return headers;
};

const ManageRole: React.FC = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [statesData] = useState<StateEntry[]>(LOCAL_STATES || []);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Role>>({
    name: "",
    description: "",
    permissions: [],
    state: "",
    district: "",
  });

  // -----------------------------
  // API calls
  // -----------------------------
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE_GET, {
        method: "GET",
        headers: buildHeaders(),
      });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const json = await res.json();
      // sample response has json.roles
      const list = Array.isArray(json.roles)
        ? json.roles
        : Array.isArray(json)
        ? json
        : [];
      setRoles(list.map(normalizeRole));
    } catch (err) {
      console.error("fetchRoles error:", err);
      showToast({
        type: "error",
        title: "Load failed",
        message: "Could not load roles from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (payload: any) => {
    const res = await fetch(API_BASE_POST, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Create failed: ${res.status} ${txt}`);
    }
  };

  const updateRole = async (payload: any) => {
    const res = await fetch(API_BASE_PUT, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Update failed: ${res.status} ${txt}`);
    }
  };

  const deleteRole = async (id: string) => {
    const res = await fetch(`${API_BASE_GET}/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Delete failed: ${res.status} ${txt}`);
    }
  };

  // -----------------------------
  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // UI helpers
  // -----------------------------
  const openCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      permissions: [],
      state: "",
      district: "",
    });
  };

  const openEdit = (r: Role) => {
    setEditingId(r.id);
    setIsCreating(false);
    setForm({ ...r });
  };

  const cancelForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm({
      name: "",
      description: "",
      permissions: [],
      state: "",
      district: "",
    });
  };

  const togglePermission = (key: PermissionKey) => {
    setForm((prev) => {
      const existing = prev.permissions || [];
      if (existing.includes(key))
        return { ...prev, permissions: existing.filter((p) => p !== key) };
      return { ...prev, permissions: [...existing, key] };
    });
  };

  const handleStateChange = (stateName: string) => {
    setForm((p) => ({ ...p, state: stateName, district: "" }));
  };

  // -----------------------------
  // Save (create or update)
  // -----------------------------
  const saveForm = async () => {
    if (!form.name || form.name.trim().length < 2) {
      alert("Provide a valid role name (min 2 chars)");
      return;
    }
    if (!form.state || !form.district) {
      alert("Please specify both State and District");
      return;
    }
    if(!form.description) {
      form.description = " ";
    }
    try {
      setLoading(true);
      if (editingId) {
        // PUT requires roleId
        const payload = {
          roleId: editingId,
          roleName: form.name,
          state: form.state,
          district: form.district,
          shortDescription: form.description,
          permissions: form.permissions || [],
        };
        await updateRole(payload);
        showToast({
          type: "success",
          title: "Updated",
          message: `${form.name} updated.`,
        });
      } else {
        const payload = {
          roleName: form.name,
          state: form.state,
          district: form.district,
          shortDescription: form.description,
          permissions: form.permissions || [],
        };
        await createRole(payload);
        showToast({
          type: "success",
          title: "Created",
          message: `${form.name} created.`,
        });
      }

      await fetchRoles();
      cancelForm();
    } catch (err) {
      console.error("saveForm error:", err);
      showToast({
        type: "error",
        title: "Save failed",
        message: (err as Error).message || "Could not save role.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Delete
  // -----------------------------
  const handleDelete = async (r: Role) => {
    if (r.builtIn) {
      alert("This role is built-in and cannot be deleted.");
      return;
    }

    try {
      setLoading(true);
      await deleteRole(r.id);
      showToast({
        type: "success",
        title: "Deleted",
        message: `${r.name} deleted.`,
      });
      await fetchRoles();
    } catch (err) {
      console.error("handleDelete error:", err);
      showToast({
        type: "error",
        title: "Delete failed",
        message: (err as Error).message || "Could not delete role.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedStateEntry = statesData.find((s) => s.state === form.state);
  const permissionCount = (r: Role) => r.permissions.length;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Roles</h1>
            <p className="text-gray-600">
              Add, edit, and manage roles information
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </button>
        </div>
      </div>

      {/* Create / Edit panel */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {editingId ? "Edit Role" : "Create Role"}
              </h2>
              <p className="text-sm text-gray-500">
                Define role name, description, state, district and permissions.
              </p>
            </div>
            <button
              onClick={cancelForm}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role Name *
              </label>
              <input
                value={form.name || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200"
                placeholder="e.g., Tahsildar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                State *
              </label>
              <select
                value={form.state || ""}
                onChange={(e) => handleStateChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Select state</option>
                {statesData.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                District *
              </label>
              <select
                value={form.district || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, district: e.target.value }))
                }
                disabled={!form.state}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">
                  {form.state ? "Select district" : "Select state first"}
                </option>
                {selectedStateEntry?.districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="md:col-span-3">
            {" "}
            <label className="block text-sm font-medium text-gray-700">
              Short Description
            </label>{" "}
            <input
              value={form.description || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200"
              placeholder="Optional"
            />{" "}
          </div>
          <div className="md:col-span-3 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERMISSIONS.map((p) => {
                const checked = (form.permissions || []).includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePermission(p.key)}
                    className={`flex items-center justify-between px-3 py-2 border rounded-lg text-sm ${
                      checked
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CheckSquare className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {p.label}
                        </div>
                        <div className="text-xs text-gray-500">{p.hint}</div>
                      </div>
                    </div>
                    {checked && (
                      <span className="text-xs text-indigo-600">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center space-x-3">
            <button
              onClick={saveForm}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" /> Save
            </button>
            <button
              onClick={cancelForm}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg"
            >
              <X className="h-4 w-4 mr-2" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roles table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Roles {loading ? "(loading...)" : `(${roles.length})`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <UserPlus className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {r.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.state || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.district || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {permissionCount(r)} perms
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="px-3 py-1 border border-indigo-300 rounded-lg text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        <Edit className="h-3 w-3 mr-1 inline" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={r.builtIn}
                        className={`px-3 py-1 border rounded-lg text-xs ${
                          r.builtIn
                            ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                            : "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                        }`}
                      >
                        <Trash2 className="h-3 w-3 mr-1 inline" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {roles.length === 0 && !loading && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No roles found
            </h3>
            <p className="text-gray-500">Create a role to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRole;
