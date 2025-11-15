import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building, 
  FileText,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

import { formatDate, getStatusColor, getPriorityColor } from '../../utils/dateUtils';

const API_URL = "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

const TappalsOverview = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [tappals, setTappals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: searchParams.get('department') || '',
    status: searchParams.get('status') || '',
    assignedTo: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // ------------------------------
  // Fetch API TAPPALS
  // ------------------------------
  useEffect(() => {
    const fetchTappals = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        const data = await res.json();

        if (Array.isArray(data)) {
          setTappals(data);
        } else if (Array.isArray(data?.data)) {
          setTappals(data.data);
        } else {
          console.error("Invalid response shape from /tappals:", data);
          setTappals([]);
        }

      } catch (err) {
        console.error("Failed to load tappals", err);
        if (showToast) showToast("Failed to load tappals", { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchTappals();
  }, [showToast]);

  // ------------------------------
  // Helper for Department Display
  // ------------------------------
  const getDeptDisplay = (tappal) => {
    if (!tappal) return '-';
    // prefer explicit departmentName
    if (tappal.departmentName && String(tappal.departmentName).trim()) {
      return tappal.departmentName;
    }
    // fallback: department string (your API returns this)
    if (typeof tappal.department === 'string' && tappal.department.trim()) {
      return tappal.department;
    }
    // fallback: department object
    if (typeof tappal.department === 'object' && tappal.department !== null) {
      return tappal.department.name || tappal.department.title || tappal.department.displayName || '-';
    }
    return '-';
  };

  // ------------------------------
  // Filtering (corrected assignedTo to use assignedToName)
  // ------------------------------
  const filteredTappals = useMemo(() => {
    return tappals.filter((tappal) => {
      // search
      const s = (searchTerm || '').toLowerCase();
      const matchesSearch =
        !s ||
        (tappal.tappalId ?? '').toString().toLowerCase().includes(s) ||
        (tappal.subject ?? '').toString().toLowerCase().includes(s) ||
        (tappal.assignedToName ?? '').toString().toLowerCase().includes(s) ||
        (getDeptDisplay(tappal) ?? '').toString().toLowerCase().includes(s);

      // department match
      const matchesDepartment =
        !filters.department || getDeptDisplay(tappal) === filters.department;

      // status match
      const matchesStatus =
        !filters.status || (tappal.status === filters.status);

      // FIXED: match assignedToName
      const matchesAssignedTo =
        !filters.assignedTo || (tappal.assignedToName === filters.assignedTo);

      // date range
      const matchesDateRange =
        (!filters.dateFrom || new Date(tappal.expiryDate) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(tappal.expiryDate) <= new Date(filters.dateTo));

      return matchesSearch && matchesDepartment && matchesStatus && matchesAssignedTo && matchesDateRange;
    });
  }, [tappals, searchTerm, filters]);

  const clearFilters = () => {
    setFilters({ department: '', status: '', assignedTo: '', dateFrom: '', dateTo: '' });
    setSearchTerm('');
  };

  const statusOptions = [...new Set(tappals.map(t => t.status))].filter(Boolean);
  const departmentOptions = [...new Set(tappals.map(getDeptDisplay))].filter(d => d && d !== '-');
  const assignedOptions = [...new Set(tappals.map(t => t.assignedToName))].filter(Boolean);

  const handleTappalClick = (id) => {
    navigate(`/tappal/${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Tappals</h1>
            <p className="text-gray-600 mt-1">Manage and track all tappals in the system</p>
          </div>
          <span className="text-sm text-gray-500">Total: {filteredTappals.length}</span>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tappals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <strong>Note:</strong> Tappals come from approved petitions.
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border rounded-lg"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {(Object.values(filters).some(v => v) || searchTerm) && (
              <button onClick={clearFilters} className="text-blue-600 font-medium">Clear All</button>
            )}
          </div>
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

              {/* Department */}
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All</option>
                  {departmentOptions.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All</option>
                  {statusOptions.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Assigned */}
              <div>
                <label className="block text-sm font-medium mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters((p) => ({ ...p, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All</option>
                  {assignedOptions.map((u, i) => (
                    <option key={i} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium mb-1">Expiry From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium mb-1">Expiry To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tappal ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y">
              {filteredTappals.map((tappal, i) => (
                <tr key={i} className="hover:bg-gray-50">

                  {/* ID */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTappalClick(tappal.tappalId)}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>{tappal.tappalId}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>

                  {/* SUBJECT */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900">{tappal.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{tappal.description}</p>
                    </div>
                  </td>

                  {/* ASSIGNED */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{tappal.assignedToName || "-"}</span>
                    </div>
                  </td>

                  {/* DEPARTMENT */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{getDeptDisplay(tappal)}</span>
                    </div>
                  </td>

                  {/* EXPIRY */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formatDate(tappal.expiryDate)}</span>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(tappal.status)}`}>
                      {tappal.status}
                    </span>
                  </td>

                  {/* PRIORITY */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(tappal.priority)}`}>
                      {tappal.priority}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleTappalClick(tappal.tappalId)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredTappals.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tappals found</h3>
            <p className="text-gray-500">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TappalsOverview;
