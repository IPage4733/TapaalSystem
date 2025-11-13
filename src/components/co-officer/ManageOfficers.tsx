import React, { useState, useEffect, useRef } from 'react';

import { useToast } from '../common/ToastContainer';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building,
  Save,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { mockUsers } from '../../data/mockUsers';
import { User, UserRole } from '../../types/User';

const GET_OFFICERS_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';
const buildOfficerDetailUrl = (id: string) => `${GET_OFFICERS_API}/${encodeURIComponent(id)}`;
const GET_DEPARTMENTS_API = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const GET_ROLES_API = 'https://2drqpw0tig.execute-api.ap-southeast-1.amazonaws.com/prod/roles';

type RoleOption = { value: UserRole; label: string; description?: string };
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

type OfficerFormState = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: RoleFormValue;
  department: string;
  phoneNumber: string;
};

const ManageOfficers: React.FC = () => {
  const { showToast } = useToast();
  const [officers, setOfficers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingIdRef = useRef<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<OfficerFormState>({
    name: '',
    email: '',
    password: '',
    role: '' as RoleFormValue,
    department: '',
    phoneNumber: ''
  });
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [departmentLoadError, setDepartmentLoadError] = useState<string | null>(null);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [roleLoadError, setRoleLoadError] = useState<string | null>(null);

  const availableRoles = roleOptions.map(option => option.value);

  const parseUserRole = (value: unknown): UserRole => {
    return availableRoles.includes(value as UserRole) ? (value as UserRole) : 'clerk';
  };

  const normalizeOfficer = (rawOfficer: unknown): User | null => {
    if (!rawOfficer || typeof rawOfficer !== 'object') {
      return null;
    }

    const data = rawOfficer as Record<string, unknown>;

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

    const id = getString('id', ['_id', 'employeeId']);
    const name = getString('name', ['fullName']);
    const email = getString('email');
    const department = getString('department') ?? 'General Administration';
    const phoneNumber = getString('phoneNumber', ['phone', 'mobile']) ?? '';
    const roleValue = parseUserRole(data['role'] ?? data['userRole']);

    if (!id || !name || !email) {
      return null;
    }

    return {
      id,
      name,
      email,
      password: '',
      role: roleValue,
      department,
      phoneNumber
    };
  };

  useEffect(() => {
    let isActive = true;

    const fetchOfficers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(GET_OFFICERS_API);

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
              : `Failed to load officers (status ${response.status}).`;
          throw new Error(errorMessage);
        }

        const candidates = Array.isArray(responseData)
          ? responseData
          : responseData && typeof responseData === 'object'
            ? (Array.isArray((responseData as { officers?: unknown }).officers)
                ? (responseData as { officers: unknown[] }).officers
                : Array.isArray((responseData as { data?: unknown }).data)
                  ? (responseData as { data: unknown[] }).data
                  : [])
            : [];

        const normalizedOfficers = candidates
          .map(normalizeOfficer)
          .filter((officer): officer is User => Boolean(officer))
          .filter(officer => officer.role !== 'co_officer');

        if (isActive) {
          setOfficers(normalizedOfficers);
        }
      } catch (error) {
        if (isActive) {
          const message = error instanceof Error ? error.message : 'An unexpected error occurred while loading officers.';
          showToast({
            type: 'error',
            title: 'Load Failed',
            message
          });
          setOfficers(mockUsers.filter(user => user.role !== 'co_officer'));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchOfficers();

    return () => {
      isActive = false;
    };
  }, [showToast]);

  useEffect(() => {
    let isActive = true;

    const fetchRoles = async () => {
      setIsRolesLoading(true);
      setRoleLoadError(null);

      try {
        const response = await fetch(GET_ROLES_API);

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

        const normalizedCandidates = candidates
          .map(normalizeRoleOption)
          .filter((option): option is RoleOption => Boolean(option));

        if (!isActive) {
          return;
        }

        if (normalizedCandidates.length === 0) {
          setRoleLoadError('No roles returned from the server. Create a role before adding officers.');
          setRoleOptions([]);
          return;
        }

        const processed = normalizedCandidates
          .map(option => {
            const label = option.label || formatRoleLabel(option.value);
            return {
              value: option.value,
              label,
              description: option.description || `Assign ${label} responsibilities.`
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        setRoleOptions(processed);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : 'An unexpected error occurred while loading roles.';
        setRoleLoadError(message);
        setRoleOptions([]);
        showToast({
          type: 'warning',
          title: 'Roles Unavailable',
          message
        });
      } finally {
        if (isActive) {
          setIsRolesLoading(false);
        }
      }
    };

    void fetchRoles();

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
      const currentRole = prev.role && roleOptions.some(option => option.value === prev.role) ? prev.role : '';
      return { ...prev, role: currentRole as RoleFormValue };
    });
  }, [roleOptions]);

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
    if (!formData.department || !formData.department.trim()) {
      return;
    }

    setDepartmentOptions(prev => {
      if (prev.includes(formData.department!)) {
        return prev;
      }
      return [...prev, formData.department!.trim()].sort((a, b) => a.localeCompare(b));
    });
  }, [formData.department]);

  const fetchOfficerDetails = async (officerId: string) => {
    setIsDetailLoading(true);
    try {
      const response = await fetch(buildOfficerDetailUrl(officerId));

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
            : `Failed to load officer details (status ${response.status}).`;
        throw new Error(errorMessage);
      }

      const candidate =
        responseData && typeof responseData === 'object'
          ? 'officer' in responseData && typeof (responseData as { officer: unknown }).officer === 'object'
            ? (responseData as { officer: unknown }).officer
            : responseData
          : null;

      const normalizedOfficer = normalizeOfficer(candidate);

      if (!normalizedOfficer) {
        throw new Error('Officer details not available.');
      }

      if (editingIdRef.current !== officerId) {
        return;
      }

      setFormData({
        id: normalizedOfficer.id,
        name: normalizedOfficer.name,
        email: normalizedOfficer.email,
        password: '',
        role: normalizedOfficer.role as RoleFormValue,
        department: normalizedOfficer.department,
        phoneNumber: normalizedOfficer.phoneNumber
      });
    } catch (error) {
      if (editingIdRef.current === officerId) {
        const message = error instanceof Error ? error.message : 'Failed to load officer details.';
        showToast({
          type: 'error',
          title: 'Details Unavailable',
          message
        });
      }
    } finally {
      if (editingIdRef.current === officerId) {
        setIsDetailLoading(false);
      }
    }
  };

  const handleAdd = () => {
    if (roleOptions.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Roles Available',
        message: 'Create a role before adding officers.'
      });
      return;
    }

    setIsAddingNew(true);
    setEditingId(null);
    editingIdRef.current = null;
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '' as RoleFormValue,
      department: '',
      phoneNumber: ''
    });
    setShowPassword(false);
    setIsDetailLoading(false);
  };

  const handleEdit = (officer: User) => {
    setEditingId(officer.id);
    editingIdRef.current = officer.id;
    setIsAddingNew(false);
    setFormData({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      password: '',
      role: officer.role as RoleFormValue,
      department: officer.department,
      phoneNumber: officer.phoneNumber
    });
    setShowPassword(false);
    void fetchOfficerDetails(officer.id);
  };

  const handleSave = async () => {
    if (isDetailLoading || isSaving) {
      return;
    }

    if (roleOptions.length === 0) {
      showToast({
        type: 'error',
        title: 'Roles Required',
        message: 'Create at least one role before managing officers.'
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.role || !formData.department || !formData.phoneNumber) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    const roleValue = formData.role;
    if (!roleValue) {
      showToast({
        type: 'error',
        title: 'Role Required',
        message: 'Please select a role for the officer.'
      });
      return;
    }
    const ensuredRole = roleValue as UserRole;

    if (isAddingNew && !formData.password) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password is required for new officers.'
      });
      return;
    }

    // Check for duplicate email
    const existingOfficer = officers.find(o => 
      o.email.toLowerCase() === formData.email!.toLowerCase() && 
      o.id !== editingId
    );
    if (existingOfficer) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Email already exists.'
      });
      return;
    }

    if (isAddingNew) {
      const newOfficer: User = {
        id: (officers.length + 2).toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: ensuredRole,
        department: formData.department,
        phoneNumber: formData.phoneNumber
      };
      setOfficers(prev => [...prev, newOfficer]);
      showToast({
        type: 'success',
        title: 'Officer Created',
        message: `${newOfficer.name} has been successfully created.`
      });
      handleCancel();
      return;
    }

    if (!editingId) {
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedDepartment = formData.department.trim();
    const trimmedPhone = formData.phoneNumber.trim();

    const payload: Record<string, unknown> = {
      name: trimmedName,
      email: trimmedEmail,
      role: ensuredRole,
      department: trimmedDepartment,
      phoneNumber: trimmedPhone
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    setIsSaving(true);

    try {
      const response = await fetch(buildOfficerDetailUrl(editingId), {
        method: 'PUT',
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
            : 'Failed to update officer.';
        throw new Error(message);
      }

      setOfficers(prev =>
        prev.map(officer =>
          officer.id === editingId
            ? {
                ...officer,
                name: trimmedName,
                email: trimmedEmail,
                role: ensuredRole,
                department: trimmedDepartment,
                phoneNumber: trimmedPhone,
                password: formData.password || officer.password
              }
            : officer
        )
      );

      showToast({
        type: 'success',
        title: 'Officer Updated',
        message: `Officer details have been successfully updated.`
      });

      handleCancel();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while updating the officer.';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    editingIdRef.current = null;
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '' as RoleFormValue,
      department: '',
      phoneNumber: ''
    });
    setShowPassword(false);
    setIsDetailLoading(false);
  };

  const handleDelete = async (officerId: string) => {
    const officer = officers.find(o => o.id === officerId);
    if (!officer) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${officer.name}?`)) {
      return;
    }

    try {
      const response = await fetch(buildOfficerDetailUrl(officerId), {
        method: 'DELETE'
      });

      if (!response.ok) {
        let responseData: unknown = null;
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }

        const message =
          responseData &&
          typeof responseData === 'object' &&
          'message' in responseData &&
          typeof (responseData as { message: unknown }).message === 'string'
            ? (responseData as { message: string }).message
            : 'Failed to delete officer.';
        throw new Error(message);
      }

      setOfficers(officers.filter(o => o.id !== officerId));
      showToast({
        type: 'success',
        title: 'Officer Deleted',
        message: `${officer.name} has been removed from the system.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the officer.';
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message
      });
    }
  };

  const handleResetPassword = (officerId: string) => {
    const newPassword = prompt('Enter new password for this officer:');
    if (newPassword && newPassword.length >= 6) {
      setOfficers(officers.map(officer => 
        officer.id === officerId 
          ? { ...officer, password: newPassword }
          : officer
      ));
      showToast({
        type: 'success',
        title: 'Password Reset',
        message: 'Password has been successfully reset.'
      });
    } else if (newPassword) {
      showToast({
        type: 'error',
        title: 'Invalid Password',
        message: 'Password must be at least 6 characters long.'
      });
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return roleOptions.find(option => option.value === role)?.label || formatRoleLabel(role);
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      co_officer: 'text-purple-600 bg-purple-100',
      collector: 'text-blue-600 bg-blue-100',
      joint_collector: 'text-indigo-600 bg-indigo-100',
      dro: 'text-cyan-600 bg-cyan-100',
      rdo: 'text-teal-600 bg-teal-100',
      tahsildar: 'text-green-600 bg-green-100',
      naib_tahsildar: 'text-emerald-600 bg-emerald-100',
      ri: 'text-yellow-600 bg-yellow-100',
      vro: 'text-orange-600 bg-orange-100',
      clerk: 'text-gray-600 bg-gray-100'
    };
    return colors[role] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Officers</h1>
              <p className="text-gray-600">Create, edit, and manage all system officers</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Officer
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isAddingNew ? 'Add New Officer' : 'Edit Officer'}
          </h2>
          {isDetailLoading && !isAddingNew && (
            <p className="mb-4 text-sm text-purple-600">Loading officer details...</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {isAddingNew ? '*' : '(leave blank to keep current)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={isAddingNew ? "Enter password" : "Enter new password"}
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
                Role *
              </label>
              <select
                value={formData.role || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as RoleFormValue }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={roleOptions.length === 0}
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
                <p className="mt-1 text-xs text-purple-500">Loading roles...</p>
              )}
              {roleLoadError && roleOptions.length === 0 && (
                <p className="mt-1 text-xs text-red-500">{roleLoadError}</p>
              )}
              {roleOptions.length === 0 && !isRolesLoading && !roleLoadError && (
                <p className="mt-1 text-xs text-gray-500">No roles available yet. Create a role before assigning officers.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={formData.department || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={departmentOptions.length === 0 && isDepartmentsLoading}
              >
                <option value="">
                  {isDepartmentsLoading ? 'Loading departments...' : 'Select department'}
                </option>
                {departmentOptions.map(departmentOption => (
                  <option key={departmentOption} value={departmentOption}>
                    {departmentOption}
                  </option>
                ))}
              </select>
              {departmentLoadError && (
                <p className="mt-1 text-xs text-red-500">{departmentLoadError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isDetailLoading}
              className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg transition-colors ${
                isDetailLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
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

      {/* Officers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            System Officers ({officers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Officer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
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
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading officers...
                  </td>
                </tr>
              ) : officers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No officers found.
                  </td>
                </tr>
              ) : (
                officers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium text-sm">
                            {officer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{officer.name}</p>
                          <p className="text-sm text-gray-500">{officer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(officer.role)}`}>
                        {getRoleLabel(officer.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{officer.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{officer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{officer.phoneNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(officer)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(officer.id)}
                          className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-lg text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleDelete(officer.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageOfficers;