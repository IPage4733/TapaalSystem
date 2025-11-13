import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { UserPlus, Eye, EyeOff, Shield, Plus } from 'lucide-react';

import { UserRole } from '../../types/User';
import { stateDistricts } from '../../data/stateDistricts';

const MANAGE_ROLES_PATH = '/co-officer-dashboard/roles?action=add';

const GET_DEPARTMENTS_API = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const GET_ROLES_API = 'https://2drqpw0tig.execute-api.ap-southeast-1.amazonaws.com/prod/roles';

type RoleOption = { value: UserRole; label: string; description: string };
type RoleFormValue = UserRole | '';

const DEFAULT_DEPARTMENTS = [
  'District Administration',
  'Revenue Department',
  'Development Office',
  'Tehsil Office',
  'Village Office',
  'General Administration',
  'Land Records',
  'Public Works Department',
  'Health Department',
  'Education Department'
];

const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
  { value: 'collector', label: 'District Collector', description: 'Highest administrative authority' },
  { value: 'joint_collector', label: 'Joint Collector', description: 'Assistant to District Collector' },
  { value: 'dro', label: 'District Revenue Officer', description: 'Revenue department head' },
  { value: 'rdo', label: 'Revenue Divisional Officer', description: 'Divisional revenue management' },
  { value: 'tahsildar', label: 'Tahsildar', description: 'Mandal level administration' },
  { value: 'naib_tahsildar', label: 'Naib Tahsildar', description: 'Assistant Tahsildar' },
  { value: 'ri', label: 'Revenue Inspector', description: 'Field level revenue officer' },
  { value: 'vro', label: 'Village Revenue Officer', description: 'Village level administration' },
  { value: 'clerk', label: 'Clerk', description: 'Administrative support' }
];

const DEFAULT_ROLE_MAP = new Map(DEFAULT_ROLE_OPTIONS.map(option => [option.value, option] as const));

const formatRoleLabel = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeForComparison = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

const slugifyRoleValue = (value: string): UserRole | null => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug ? (slug as UserRole) : null;
};

const KNOWN_ROLE_VALUES: UserRole[] = [
  'collector',
  'joint_collector',
  'co_officer',
  'dro',
  'rdo',
  'tahsildar',
  'naib_tahsildar',
  'ri',
  'vro',
  'clerk'
];

const canonicalizeRoleValue = (value: string): UserRole | null => {
  if (!value) {
    return null;
  }

  const normalizedCandidate = normalizeForComparison(value);
  for (const knownRole of KNOWN_ROLE_VALUES) {
    if (normalizeForComparison(knownRole) === normalizedCandidate) {
      return knownRole;
    }
  }

  const fallback = DEFAULT_ROLE_OPTIONS.find(option => normalizeForComparison(option.label) === normalizedCandidate);
  if (fallback) {
    return fallback.value;
  }

  return slugifyRoleValue(value);
};

const tryGetString = (data: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const normalizeRoleOption = (raw: unknown): RoleOption | null => {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    const value = canonicalizeRoleValue(raw);
    if (!value) {
      return null;
    }
    const fallback = DEFAULT_ROLE_MAP.get(value);
    const label = fallback?.label ?? formatRoleLabel(value);
    const description = fallback?.description ?? `Assign ${label} responsibilities.`;
    return { value, label, description };
  }

  if (typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const valueCandidate =
    tryGetString(data, ['value', 'role', 'roleName', 'role_code', 'code', 'key', 'id', 'name']) ??
    tryGetString(data, ['label', 'displayName', 'title']);

  if (!valueCandidate) {
    return null;
  }

  const value = canonicalizeRoleValue(valueCandidate);
  if (!value) {
    return null;
  }

  const fallback = DEFAULT_ROLE_MAP.get(value);
  const labelCandidate = tryGetString(data, ['label', 'name', 'displayName', 'title', 'roleLabel', 'role_name']);
  const descriptionCandidate = tryGetString(data, ['description', 'details', 'summary', 'roleDescription']);

  const label = labelCandidate ?? fallback?.label ?? formatRoleLabel(value);
  const description = descriptionCandidate ?? fallback?.description ?? `Assign ${label} responsibilities.`;

  return { value, label, description };
};

const CreateOfficer: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    state: '',
    district: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as RoleFormValue,
    department: '',
    phoneNumber: '',
    employeeId: '',
    joiningDate: ''
  });
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [roleLoadError, setRoleLoadError] = useState<string | null>(null);

  const [departmentOptions, setDepartmentOptions] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [departmentLoadError, setDepartmentLoadError] = useState<string | null>(null);

  const stateOptions = Object.keys(stateDistricts);

  const rolesFetchControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);

  const fetchRoles = useCallback(
    async ({ suppressToast = false }: { suppressToast?: boolean } = {}) => {
      rolesFetchControllerRef.current?.abort();
      const controller = new AbortController();
      rolesFetchControllerRef.current = controller;

      setRoleLoadError(null);
      setIsRolesLoading(true);

      try {
        const response = await fetch(GET_ROLES_API, { signal: controller.signal });

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
              : `Failed to load roles (status ${response.status}).`;
          throw new Error(errorMessage);
        }

        const candidates = Array.isArray(responseData)
          ? responseData
          : responseData && typeof responseData === 'object'
            ? (Array.isArray((responseData as { roles?: unknown }).roles)
                ? (responseData as { roles: unknown[] }).roles
                : Array.isArray((responseData as { data?: unknown }).data)
                  ? (responseData as { data: unknown[] }).data
                  : [])
            : [];

        const normalizedRoles = candidates
          .map(normalizeRoleOption)
          .filter((option): option is RoleOption => Boolean(option));

        if (controller.signal.aborted || !isMountedRef.current) {
          return;
        }

        if (normalizedRoles.length === 0) {
          setRoleLoadError('No roles returned from the server. Create a role before adding officers.');
          setRoleOptions([]);
          return;
        }

        const processed = normalizedRoles
          .map(option => {
            const fallback = DEFAULT_ROLE_MAP.get(option.value);
            const label = option.label || fallback?.label || formatRoleLabel(option.value);
            const description = option.description || fallback?.description || `Assign ${label} responsibilities.`;
            return { value: option.value, label, description };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        setRoleOptions(processed);
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError' || controller.signal.aborted || !isMountedRef.current) {
          return;
        }

        const message = error instanceof Error ? error.message : 'An unexpected error occurred while loading roles.';
        setRoleLoadError(message);
        setRoleOptions([]);
        if (!suppressToast) {
          showToast({
            type: 'warning',
            title: 'Roles Unavailable',
            message
          });
        }
      } finally {
        if (!controller.signal.aborted && isMountedRef.current) {
          setIsRolesLoading(false);
        }

        if (rolesFetchControllerRef.current === controller) {
          rolesFetchControllerRef.current = null;
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      rolesFetchControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    let isActive = true;

    const fetchDepartments = async () => {
      setIsDepartmentsLoading(true);
      setDepartmentLoadError(null);

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

        const possibleNameKeys = ['name', 'departmentName', 'department', 'label', 'title'];

        const fetchedNames = Array.from(
          new Set(
            candidates
              .map((rawDepartment): string | null => {
                if (!rawDepartment || typeof rawDepartment !== 'object') {
                  return null;
                }

                const data = rawDepartment as Record<string, unknown>;

                for (const key of possibleNameKeys) {
                  const value = data[key];
                  if (typeof value === 'string' && value.trim()) {
                    return value.trim();
                  }
                }

                return null;
              })
              .filter((name): name is string => Boolean(name))
          )
        ).sort((a, b) => a.localeCompare(b));

        if (!isActive) {
          return;
        }

        if (fetchedNames.length === 0) {
          setDepartmentLoadError('No departments returned from the server. Using defaults.');
          setDepartmentOptions(prev => (prev.length > 0 ? prev : DEFAULT_DEPARTMENTS));
          return;
        }

        setDepartmentOptions(fetchedNames);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : 'An unexpected error occurred while loading departments.';
        setDepartmentLoadError(message);
        setDepartmentOptions(prev => (prev.length > 0 ? prev : DEFAULT_DEPARTMENTS));
        showToast({
          type: 'warning',
          title: 'Departments Unavailable',
          message
        });
      } finally {
        if (isActive) {
          setIsDepartmentsLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      isActive = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (roleOptions.length === 0) {
      setFormData(prev => ({ ...prev, role: '' as RoleFormValue }));
      return;
    }

    setFormData(prev => {
      if (roleOptions.some(option => option.value === prev.role)) {
        return prev;
      }
      return { ...prev, role: '' as RoleFormValue };
    });
  }, [roleOptions]);

  useEffect(() => {
    const value = formData.department;
    if (!value || !value.trim()) {
      return;
    }

    const trimmed = value.trim();

    setDepartmentOptions(prev => {
      if (prev.includes(trimmed)) {
        return prev;
      }
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b));
    });
  }, [formData.department]);

  const handleOpenManageDepartments = () => {
    navigate('/co-officer-dashboard/departments?action=add');
  };

  const handleOpenManageRoles = () => {
    navigate(MANAGE_ROLES_PATH);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    // Validation
    if (!formData.state || !formData.district || !formData.name || !formData.email || !formData.password || !formData.confirmPassword ||
        !formData.department || !formData.phoneNumber || !formData.role) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    if (roleOptions.length === 0) {
      showToast({
        type: 'error',
        title: 'Roles Required',
        message: 'Create at least one role before adding a new officer.'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'Password and confirm password do not match.'
      });
      return;
    }

    if (formData.password.length < 6) {
      showToast({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    // Generate employee ID if not provided
    const employeeId = formData.employeeId || `EMP${Date.now().toString().slice(-6)}`;
    
    // In real implementation, this would:
    // 1. Create officer record in database
    // 2. Send welcome email with credentials
    // 3. Create initial permissions
    // 4. Log creation activity
    const payload = {
      state: formData.state,
      district: formData.district,
      name: formData.name,
      fullName: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
      phone: formData.phoneNumber,
      employeeId,
      joiningDate: formData.joiningDate || undefined
    };

    setIsSubmitting(true);

    try {
      const response = await fetch('https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const message =
          responseData &&
          typeof responseData === 'object' &&
          'message' in responseData &&
          typeof (responseData as { message: unknown }).message === 'string'
            ? (responseData as { message: string }).message
            : 'Failed to create officer.';
        showToast({
          type: 'error',
          title: 'Creation Failed',
          message
        });
        return;
      }

      const responseName =
        responseData &&
        typeof responseData === 'object' &&
        'name' in responseData &&
        typeof (responseData as { name: unknown }).name === 'string'
          ? (responseData as { name: string }).name
          : formData.name;
      const responseEmployeeId =
        responseData &&
        typeof responseData === 'object' &&
        'employeeId' in responseData &&
        typeof (responseData as { employeeId: unknown }).employeeId === 'string'
          ? (responseData as { employeeId: string }).employeeId
          : employeeId;
      const roleLabel = selectedRole?.label ?? formData.role;

      showToast({
        type: 'success',
        title: 'Officer Created Successfully!',
        message: `${responseName} has been created as ${roleLabel}. Employee ID: ${responseEmployeeId}`,
        duration: 8000
      });

      setFormData({
        state: '',
        district: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'clerk',
        department: '',
        phoneNumber: '',
        employeeId: '',
        joiningDate: ''
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while creating the officer.';
      showToast({
        type: 'error',
        title: 'Network Error',
        message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      state: '',
      district: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'clerk',
      department: '',
      phoneNumber: '',
      employeeId: '',
      joiningDate: ''
    });
  };

  const selectedRole = formData.role ? roleOptions.find(r => r.value === formData.role) : undefined;
  const availableDistricts = formData.state ? stateDistricts[formData.state] || [] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <UserPlus className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Officer</h1>
            <p className="text-gray-600">Add a new officer to the system with appropriate role and permissions</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email address"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value, district: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select state...</option>
                  {stateOptions.map(state => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={!formData.state}
                  required
                >
                  <option value="">{formData.state ? 'Select district...' : 'Select state first'}</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Role and Department */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role and Department</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={departmentOptions.length === 0 && isDepartmentsLoading}
                  required
                >
                  <option value="">
                    {isDepartmentsLoading ? 'Loading departments...' : 'Select department...'}
                  </option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {departmentLoadError && (
                  <p className="mt-1 text-xs text-red-500">{departmentLoadError}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleOpenManageDepartments}
                    className="inline-flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add department</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as RoleFormValue }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={roleOptions.length === 0}
                  required
                >
                  <option value="" disabled>
                    {isRolesLoading ? 'Loading roles...' : 'Select a role'}
                  </option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isRolesLoading && roleOptions.length === 0 && (
                  <p className="text-xs text-purple-500 mt-1">Loading roles...</p>
                )}
                {roleLoadError && roleOptions.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">{roleLoadError}</p>
                )}
                {roleOptions.length === 0 && !isRolesLoading && !roleLoadError && (
                  <p className="text-xs text-gray-500 mt-1">No roles available yet. Create a role before assigning officers.</p>
                )}
                {selectedRole && (
                  <p className="text-xs text-gray-500 mt-1">{selectedRole.description}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleOpenManageRoles}
                    className="inline-flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add role</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                />
              </div>
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
              disabled={isSubmitting}
              className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserPlus className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Officer'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Security Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-purple-800 mb-2">Security Guidelines</h3>
            <div className="text-purple-700 space-y-1">
              <p>• <strong>Password Policy:</strong> Minimum 6 characters required</p>
              <p>• <strong>Email Verification:</strong> Welcome email will be sent to the officer</p>
              <p>• <strong>Role Permissions:</strong> Access rights are automatically assigned based on role</p>
              <p>• <strong>Employee ID:</strong> Auto-generated if not provided</p>
              <p>• <strong>Account Activation:</strong> Officer can login immediately after creation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOfficer;