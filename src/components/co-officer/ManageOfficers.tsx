import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { User } from '../../types/User';

const API_BASE = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev';
const DEPARTMENTS_API = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const ROLES_API = 'https://2drqpw0tig.execute-api.ap-southeast-1.amazonaws.com/prod/roles';

const ManageOfficers: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [officers, setOfficers] = useState<User[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<Array<{ id: string; departmentName: string }>>([]);
  const [rolesFromApi, setRolesFromApi] = useState<Array<{ roleId: string; roleName: string }>>([]);

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: 'clerk' as any,
    department: '',
    phoneNumber: ''
  });

  useEffect(() => {
    fetchOfficers();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/officer`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.officers)) {
        const mapped: User[] = data.officers.map((o: any) => ({
          id: o.id,
          name: o.name,
          email: o.email,
          password: o.password,
          role: (o.role || '').toString() as any,
          department: o.department,
          phoneNumber: o.phone || o.phoneNumber || ''
        }));
        setOfficers(mapped);
      } else {
        showToast({ type: 'error', title: 'Load Failed', message: 'Unable to load officers.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to fetch officers.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(DEPARTMENTS_API);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data.map((d: any) => ({ id: d.id, departmentName: d.departmentName })));
      } else {
        showToast({ type: 'error', title: 'Departments', message: 'Failed to load departments.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to fetch departments.' });
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(ROLES_API);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.roles)) {
        setRolesFromApi(data.roles.map((r: any) => ({ roleId: r.roleId, roleName: r.roleName })));
      } else {
        showToast({ type: 'error', title: 'Roles', message: 'Failed to load roles.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to fetch roles.' });
    }
  };

  const handleAdd = () => {
    // Use a full absolute redirect to avoid React Router appending paths.
    window.location.href = 'http://localhost:5173/co-officer-dashboard/create-officer';
  };

  const handleEdit = async (officer: User) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/officer/${officer.id}`);
      const data = await res.json();
      if (data && data.success && data.officer) {
        const o = data.officer;
        setEditingId(o.id);
        setIsAddingNew(false);
        setFormData({
          id: o.id,
          name: o.name,
          email: o.email,
          password: '',
          role: (o.role || 'clerk') as any,
          department: o.department,
          phoneNumber: o.phone || ''
        });
      } else {
        showToast({ type: 'error', title: 'Load Failed', message: 'Unable to load officer details.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to fetch officer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.role || !formData.department || !formData.phoneNumber) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
      return;
    }

    const existingOfficer = officers.find(o => o.email.toLowerCase() === formData.email!.toLowerCase() && o.id !== editingId);
    if (existingOfficer) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Email already exists.' });
      return;
    }

    if (!editingId) {
      // no create endpoint provided in API spec -> redirect to dedicated create page
      window.location.href = 'http://localhost:5173/co-officer-dashboard/create-officer';
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        phone: formData.phoneNumber,
        ...(formData.password ? { password: formData.password } : {})
      };

      const res = await fetch(`${API_BASE}/officer/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        setOfficers(prev => prev.map(o => o.id === editingId ? ({
          ...(o as User),
          name: formData.name!,
          email: formData.email!,
          department: formData.department!,
          role: formData.role!,
          phoneNumber: formData.phoneNumber!,
          password: formData.password ? formData.password : o.password
        }) : o));

        showToast({ type: 'success', title: 'Officer Updated', message: 'Officer details have been successfully updated.' });
        handleCancel();
      } else {
        showToast({ type: 'error', title: 'Update Failed', message: 'Unable to update officer.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to update officer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'clerk' as any,
      department: '',
      phoneNumber: ''
    });
    setShowPassword(false);
  };

  const handleDelete = async (officerId: string) => {
    const officer = officers.find(o => o.id === officerId);
    if (!officer) return;
    if (!window.confirm(`Are you sure you want to delete ${officer.name}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/officer/${officerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data && data.success) {
        setOfficers(prev => prev.filter(o => o.id !== officerId));
        showToast({ type: 'success', title: 'Officer Deleted', message: `${officer.name} has been removed from the system.` });
      } else {
        showToast({ type: 'error', title: 'Delete Failed', message: 'Unable to delete officer.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to delete officer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (officerId: string) => {
    const newPassword = prompt('Enter new password for this officer:');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      showToast({ type: 'error', title: 'Invalid Password', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/officer/${officerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (data && data.success) {
        setOfficers(prev => prev.map(o => o.id === officerId ? ({ ...o, password: newPassword }) : o));
        showToast({ type: 'success', title: 'Password Reset', message: 'Password has been successfully reset.' });
      } else {
        showToast({ type: 'error', title: 'Reset Failed', message: 'Unable to reset password.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Network Error', message: 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'village revenue officer': 'text-orange-600 bg-orange-100',
      'Collector': 'text-blue-600 bg-blue-100',
      'REVENUE INSPECTOR': 'text-yellow-600 bg-yellow-100',
      'Tashildhar': 'text-green-600 bg-green-100'
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{isAddingNew ? 'Add New Officer' : 'Edit Officer'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={formData.name || ''} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input type="email" value={formData.email || ''} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter email address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password {isAddingNew ? '*' : '(leave blank to keep current)'}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password || ''} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={isAddingNew ? "Enter password" : "Enter new password"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">{showPassword ? (<EyeOff className="h-4 w-4 text-gray-400" />) : (<Eye className="h-4 w-4 text-gray-400" />)}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select value={(formData.role as string) || ''} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select role</option>
                {rolesFromApi.map(r => (
                  <option key={r.roleId} value={r.roleName}>{r.roleName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select value={formData.department || ''} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="tel" value={formData.phoneNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter phone number" />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <button onClick={handleSave} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><Save className="h-4 w-4 mr-2" />Save</button>
            <button onClick={handleCancel} className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4 mr-2" />Cancel</button>
          </div>
        </div>
      )}

      {/* Officers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">System Officers ({officers.length})</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officers.map((officer) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><span className="text-purple-600 font-medium text-sm">{officer.name.split(' ').map(n => n[0]).join('')}</span></div><div><p className="text-sm font-medium text-gray-900">{officer.name}</p><p className="text-sm text-gray-500">{officer.email}</p></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(officer.role as any)}`}>{getRoleLabel(officer.role as any)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center space-x-2"><Building className="h-4 w-4 text-gray-400" /><span className="text-sm text-gray-900">{officer.department}</span></div></td>
                  <td className="px-6 py-4"><div className="space-y-1"><div className="flex items-center space-x-2"><Mail className="h-4 w-4 text-gray-400" /><span className="text-sm text-gray-900">{officer.email}</span></div><div className="flex items-center space-x-2"><Phone className="h-4 w-4 text-gray-400" /><span className="text-sm text-gray-500">{officer.phoneNumber}</span></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Active</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center space-x-2"><button onClick={() => handleEdit(officer)} className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"><Edit className="h-3 w-3 mr-1" />Edit</button><button onClick={() => handleResetPassword(officer.id)} className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-lg text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"><RotateCcw className="h-3 w-3 mr-1" />Reset</button><button onClick={() => handleDelete(officer.id)} className="inline-flex items-center px-3 py-1 border border-red-300 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"><Trash2 className="h-3 w-3 mr-1" />Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageOfficers;