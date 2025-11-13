import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  AlertTriangle
} from 'lucide-react';
import { mockDepartments, mockTappals } from '../../data/mockTappals';
import { Department } from '../../types/Tappal';
import { stateDistricts } from '../../data/stateDistricts';

// const GET_DEPARTMENTS_API = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const GET_DEPARTMENTS_API = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const DEPARTMENTS_STORAGE_KEY = 'tapaal_departments';

const ManageDepartments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightDepartmentId = searchParams.get('highlight');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    code: '',
    state: '',
    district: '',
    contactEmail: '',
    headOfDepartment: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const setDepartmentsWithCache = (update: Department[] | ((prev: Department[]) => Department[])) => {
    setDepartments(prev => {
      const next = typeof update === 'function' ? (update as (prevDepartments: Department[]) => Department[])(prev) : update;
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const normalizeDepartment = (rawDepartment: unknown): Department | null => {
    if (!rawDepartment || typeof rawDepartment !== 'object') {
      return null;
    }

    const data = rawDepartment as Record<string, unknown>;

    const getString = (key: string, fallbackKeys: string[] = []): string | undefined => {
      if (typeof data[key] === 'string' && data[key]) {
        return (data[key] as string).trim();
      }
      for (const fallbackKey of fallbackKeys) {
        if (typeof data[fallbackKey] === 'string' && data[fallbackKey]) {
          return (data[fallbackKey] as string).trim();
        }
      }
      return undefined;
    };

    const id = getString('id', ['_id', 'departmentId']);
    const name = getString('name', ['departmentName']);
    const code = getString('code', ['departmentCode']) ?? (name ? name.slice(0, 3).toUpperCase() : 'DEP');
    const state = getString('state', ['stateName']) ?? 'Unknown State';
    const district = getString('district', ['districtName']) ?? 'Unknown District';
    const contactEmail = getString('contactEmail', ['email']) ?? 'contact@example.com';
    const headOfDepartment = getString('headOfDepartment', ['hod', 'head']) ?? 'Not Assigned';
    const createdAtValue = getString('createdAt', ['created_on', 'createdDate']);

    const createdAt = createdAtValue && !Number.isNaN(Date.parse(createdAtValue))
      ? new Date(createdAtValue).toISOString()
      : new Date().toISOString();

    const isActiveValue = data['isActive'] ?? data['active'] ?? data['status'];
    const isActive = typeof isActiveValue === 'boolean'
      ? isActiveValue
      : typeof isActiveValue === 'string'
        ? ['active', 'true', '1'].includes(isActiveValue.toLowerCase())
        : true;

    if (!id || !name) {
      return null;
    }

    return {
      id,
      name,
      code,
      district,
      state,
      contactEmail,
      headOfDepartment,
      createdAt,
      isActive
    };
  };

  const handleAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      state: '',
      district: '',
      contactEmail: '',
      headOfDepartment: ''
    });
  };

  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'add') {
      handleAdd();
    }
  }, [action]);

  useEffect(() => {
    try {
      const cachedDepartments = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (cachedDepartments) {
        const parsed = JSON.parse(cachedDepartments) as unknown;
        const normalizedCached = Array.isArray(parsed)
          ? parsed
              .map(normalizeDepartment)
              .filter((department): department is Department => Boolean(department))
          : [];

        if (normalizedCached.length > 0) {
          setDepartments(normalizedCached);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.warn('Failed to restore cached departments.', error);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchDepartments = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(GET_DEPARTMENTS_API);

        let responseData: unknown = null;
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }

        if (!response.ok) {
          const errorMessage =
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData &&
            typeof (responseData as { message: unknown }).message === 'string'
              ? (responseData as { message: string }).message
              : `Failed to load departments (status ${response.status}).`;
          throw new Error(errorMessage);
        }

        const candidates = Array.isArray(responseData)
          ? responseData
          : responseData && typeof responseData === 'object'
            ? (Array.isArray((responseData as { departments?: unknown }).departments)
                ? (responseData as { departments: unknown[] }).departments
                : Array.isArray((responseData as { data?: unknown }).data)
                  ? (responseData as { data: unknown[] }).data
                  : [])
            : [];

        const normalizedDepartments = candidates
          .map(normalizeDepartment)
          .filter((department): department is Department => Boolean(department));

        if (!isActive) {
          return;
        }

        if (normalizedDepartments.length === 0) {
          setLoadError('No departments returned from the server. Showing mock data.');
          setDepartmentsWithCache(prev => {
            if (prev.length > 0) {
              return prev;
            }
            return mockDepartments;
          });
          return;
        }

        setDepartmentsWithCache(prev => {
          if (prev.length === 0) {
            return normalizedDepartments;
          }

          const existingIds = new Set(normalizedDepartments.map(department => department.id));
          const prevMap = new Map(prev.map(department => [department.id, department]));

          const merged = [
            ...normalizedDepartments.map(department => prevMap.get(department.id) ?? department),
            ...prev.filter(department => !existingIds.has(department.id))
          ];

          return merged;
        });
      } catch (error) {
        if (isActive) {
          const message = error instanceof Error ? error.message : 'An unexpected error occurred while loading departments.';
          setLoadError(message);
          setDepartmentsWithCache(prev => (prev.length > 0 ? prev : mockDepartments));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      isActive = false;
    };
  }, []);

  const handleEdit = (department: Department) => {
    setEditingId(department.id);
    setIsAddingNew(false);
    setFormData(department);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.state || !formData.district || !formData.contactEmail || !formData.headOfDepartment) {
      alert('Please fill in all required fields');
      return;
    }

    if (isAddingNew) {
      const newDepartment: Department = {
        id: (departments.length + 1).toString(),
        name: formData.name!,
        code: formData.code!,
        district: formData.district || 'Sample District',
        state: formData.state || 'Sample State',
        contactEmail: formData.contactEmail!,
        headOfDepartment: formData.headOfDepartment!,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      setDepartmentsWithCache([...departments, newDepartment]);
    } else if (editingId) {
      setDepartmentsWithCache(departments.map(dept => 
        dept.id === editingId 
          ? { ...dept, ...formData } as Department
          : dept
      ));
    }

    handleCancel();
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      state: '',
      district: '',
      contactEmail: '',
      headOfDepartment: ''
    });
  };

  const handleDelete = (departmentId: string) => {
    // Check if department has tappals
    const hasTappals = mockTappals.some(tappal => tappal.department === departmentId);
    
    if (hasTappals) {
      alert('Cannot delete department. There are existing tappals assigned to this department.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this department?')) {
      setDepartmentsWithCache(departments.filter(dept => dept.id !== departmentId));
    }
  };

  const stateOptions = Object.keys(stateDistricts);
  const availableDistricts = formData.state ? stateDistricts[formData.state] || [] : [];

  const getDepartmentTappalCount = (departmentId: string) => {
    return mockTappals.filter(tappal => tappal.department === departmentId).length;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Departments</h1>
              <p className="text-gray-600">Add, edit, and manage department information</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            {isAddingNew ? 'Add New Department' : 'Edit Department'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department code (e.g., REV)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <select
                value={formData.state || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value, district: '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select state...</option>
                {stateOptions.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                value={formData.district || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.state}
              >
                <option value="">{formData.state ? 'Select district...' : 'Select state first'}</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact email"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Head of Department *
              </label>
              <input
                type="text"
                value={formData.headOfDepartment || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, headOfDepartment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter head of department name"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
          {loadError && (
            <p className="mt-2 text-sm text-red-600">{loadError}</p>
          )}
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
                  District
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading departments...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    No departments found.
                  </td>
                </tr>
              ) : (
                departments.map((department) => {
                  const tappalCount = getDepartmentTappalCount(department.id);
                  const canDelete = tappalCount === 0;

                  return (
                    <tr
                      key={department.id}
                      className={`hover:bg-gray-50 ${
                        highlightDepartmentId === department.id ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{department.name}</p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(department.createdAt).toLocaleDateString()}
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
                          <span className="text-sm text-gray-900">{department.headOfDepartment}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{department.contactEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{department.district}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">{tappalCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            department.isActive
                              ? 'text-green-600 bg-green-100'
                              : 'text-red-600 bg-red-100'
                          }`}
                        >
                          {department.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(department)}
                            className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(department.id)}
                            disabled={!canDelete}
                            className={`inline-flex items-center px-3 py-1 border rounded-lg text-xs font-medium transition-colors ${
                              canDelete
                                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                            }`}
                            title={!canDelete ? 'Cannot delete: Department has existing tappals' : 'Delete department'}
                          >
                            {!canDelete && <AlertTriangle className="h-3 w-3 mr-1" />}
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageDepartments;