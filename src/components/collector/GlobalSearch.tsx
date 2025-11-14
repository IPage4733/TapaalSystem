import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastContainer';
import { 
  Search, 
  FileText, 
  User, 
  Phone, 
  Building, 
  Calendar,
  ExternalLink,
  Filter
} from 'lucide-react';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

// Replace / keep these endpoints you provided
const API_LIST_PETITIONS =
  "https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition";
const DEPTS_URL =
  "https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew";
const OFFICERS_URL =
  "https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');

  // data from APIs (transformed into shapes your component expects)
  const [tappals, setTappals] = useState<any[]>([]); // from petitions endpoint
  const [users, setUsers] = useState<any[]>([]); // from officers endpoint
  const [departments, setDepartments] = useState<any[]>([]); // from depts endpoint

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map incoming API shapes to the local shapes used by the search logic / UI
  useEffect(() => {
    const ac = new AbortController();
    const signal = ac.signal;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [petRes, deptRes, offRes] = await Promise.all([
          fetch(API_LIST_PETITIONS, { signal }),
          fetch(DEPTS_URL, { signal }),
          fetch(OFFICERS_URL, { signal })
        ]);

        if (!petRes.ok) throw new Error(`Petitions fetch failed: ${petRes.status}`);
        if (!deptRes.ok) throw new Error(`Departments fetch failed: ${deptRes.status}`);
        if (!offRes.ok) throw new Error(`Officers fetch failed: ${offRes.status}`);

        const petitions = await petRes.json();
        const depts = await deptRes.json();
        const officersRaw = await offRes.json();

        // petitions endpoint returned an array => transform to tappal-like objects
        const tappalData = Array.isArray(petitions)
          ? petitions.map((p: any) => ({
              // original component expects tappalId, petitionId, subject, description, assignedToName, departmentName, status, createdAt, etc.
              tappalId: p.tappleId || '', // some items have empty tappleId
              petitionId: p.petitionId,
              subject: p.subject || '',
              description: p.description || '',
              assignedToName: p.assignedToName || '', // not provided by petitions -> empty
              departmentName: p.departmentName || '',
              status: p.status || '',
              createdAt: p.createdAt || '',
              // keep original petition raw data for potential detail navigation
              raw: p
            }))
          : [];

        // departments endpoint: you provided array of objects with id, departmentName, departmentCode, contactEmail, headOfDepartment
        const deptData = Array.isArray(depts)
          ? depts.map((d: any) => ({
              id: d.id,
              name: d.departmentName || d.departmentName || '',
              code: d.departmentCode || '',
              contactEmail: d.contactEmail || '',
              headOfDepartment: d.headOfDepartment || '',
              raw: d
            }))
          : [];

        // officers endpoint returns { success: true, count: X, officers: [...] }
        const officersList = Array.isArray(officersRaw?.officers)
          ? officersRaw.officers
          : Array.isArray(officersRaw)
          ? officersRaw
          : [];

        // transform officers to match previous mockUsers structure
        const usersData = officersList.map((o: any) => ({
          id: o.id || o.email || o.phone || Math.random().toString(36).slice(2, 9),
          name: o.name || '',
          email: o.email || '',
          phoneNumber: o.phone || o.mobileNumber || '',
          department: o.department || '',
          role: (o.role || '').toString().toLowerCase().replace(/\s+/g, '_'),
          raw: o
        }));

        setTappals(tappalData);
        setDepartments(deptData);
        setUsers(usersData);
        setLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
        showToast?.({ type: 'error', message: 'Failed to load search data' });
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // load once on mount

  // matchField helpers (same logic as before)
  const getMatchField = (tappal: any, term: string) => {
    if ((tappal.tappalId || '').toLowerCase().includes(term)) return 'Tappal ID';
    if ((tappal.petitionId || '').toLowerCase().includes(term)) return 'Petition ID';
    if ((tappal.subject || '').toLowerCase().includes(term)) return 'Subject';
    if ((tappal.assignedToName || '').toLowerCase().includes(term)) return 'Assigned Officer';
    if ((tappal.departmentName || '').toLowerCase().includes(term)) return 'Department';
    return 'Description';
  };

  const getUserMatchField = (user: any, term: string) => {
    if ((user.name || '').toLowerCase().includes(term)) return 'Name';
    if ((user.email || '').toLowerCase().includes(term)) return 'Email';
    if ((user.phoneNumber || '').includes(term)) return 'Phone';
    return 'Department';
  };

  const getDepartmentMatchField = (dept: any, term: string) => {
    if ((dept.name || '').toLowerCase().includes(term)) return 'Name';
    if ((dept.code || '').toLowerCase().includes(term)) return 'Code';
    if ((dept.contactEmail || '').toLowerCase().includes(term)) return 'Email';
    return 'Head of Department';
  };

  // search logic - same as before but uses fetched arrays
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results: any[] = [];

    if ((searchType === 'all' || searchType === 'tappal') && tappals.length) {
      tappals.forEach(tappal => {
        if (
          (tappal.tappalId || '').toLowerCase().includes(term) ||
          (tappal.subject || '').toLowerCase().includes(term) ||
          (tappal.description || '').toLowerCase().includes(term) ||
          (tappal.assignedToName || '').toLowerCase().includes(term) ||
          (tappal.departmentName || '').toLowerCase().includes(term) ||
          (tappal.petitionId || '').toLowerCase().includes(term)
        ) {
          results.push({
            type: 'tappal',
            data: tappal,
            matchField: getMatchField(tappal, term)
          });
        }
      });
    }

    if ((searchType === 'all' || searchType === 'user') && users.length) {
      users.forEach(user => {
        if (
          (user.name || '').toLowerCase().includes(term) ||
          (user.email || '').toLowerCase().includes(term) ||
          (user.phoneNumber || '').includes(term) ||
          (user.department || '').toLowerCase().includes(term)
        ) {
          results.push({
            type: 'user',
            data: user,
            matchField: getUserMatchField(user, term)
          });
        }
      });
    }

    if ((searchType === 'all' || searchType === 'department') && departments.length) {
      departments.forEach(dept => {
        if (
          (dept.name || '').toLowerCase().includes(term) ||
          (dept.code || '').toLowerCase().includes(term) ||
          (dept.contactEmail || '').toLowerCase().includes(term) ||
          (dept.headOfDepartment || '').toLowerCase().includes(term)
        ) {
          results.push({
            type: 'department',
            data: dept,
            matchField: getDepartmentMatchField(dept, term)
          });
        }
      });
    }

    return results;
  }, [searchTerm, searchType, tappals, users, departments]);

  const searchTypeOptions = [
    { value: 'all', label: 'All Records' },
    { value: 'tappal', label: 'Tappals Only' },
    { value: 'user', label: 'Users Only' },
    { value: 'department', label: 'Departments Only' }
  ];

  const handleTappalClick = (tappalId: string, petitionRaw?: any) => {
    // If tappalId exists navigate to tappal, otherwise fall back to petition detail by petitionId
    if (tappalId) {
      navigate(`/tappal/${tappalId}`);
    } else if (petitionRaw?.petitionId) {
      navigate(`/petition/${petitionRaw.petitionId}`);
    } else {
      // fallback: open petition detail if raw available
      showToast?.({ type: 'info', message: 'No tappal id available for this petition' });
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/collector-dashboard/users?highlight=${encodeURIComponent(userId)}`);
  };

  const handleDepartmentClick = (departmentId: string) => {
    navigate(`/collector-dashboard/departments?highlight=${encodeURIComponent(departmentId)}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Global Search</h1>
        <p className="text-gray-600">Search across all tappals, users, and departments</p>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          {/* Search Type Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {searchTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSearchType(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchType === option.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Tappal ID, Petition ID, Officer Name, Phone Number, Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Search Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Search Tips:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Search by Tappal ID (e.g., TAP-2025-001)</li>
              <li>• Search by Petition ID (e.g., PET-2025-001)</li>
              <li>• Search by Officer name or phone number</li>
              <li>• Search by department name or code</li>
              <li>• Use partial matches for broader results</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">Loading search data…</div>
      )}
      {error && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-red-600">
          Error loading data: {error}
        </div>
      )}

      {/* Search Results */}
      {!loading && searchTerm.trim() && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.length > 0 && (
              <span className="text-sm text-gray-500">
                Showing results for "{searchTerm}"
              </span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try different search terms or check your spelling.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  {result.type === 'tappal' && (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600 uppercase">Tappal</span>
                          <span className="text-xs text-gray-500">Match in: {result.matchField}</span>
                        </div>
                        <button
                          onClick={() => handleTappalClick(result.data.tappalId, result.data.raw)}
                          className="text-lg font-medium text-gray-900 hover:text-blue-600 flex items-center space-x-1"
                        >
                          <span>{result.data.tappalId || result.data.petitionId}</span>
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <p className="text-gray-600 mt-1">{result.data.subject}</p>
                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{result.data.assignedToName || '—'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{result.data.departmentName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(result.data.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.data.status)}`}>
                        {result.data.status}
                      </span>
                    </div>
                  )}

                  {result.type === 'user' && (
                    <button
                      onClick={() => handleUserClick(result.data.id)}
                      className="w-full flex items-start justify-between text-left hover:bg-gray-100 rounded-lg p-2 -m-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-5 w-5 text-green-600" />
                          <span className="text-xs font-medium text-green-600 uppercase">User</span>
                          <span className="text-xs text-gray-500">Match in: {result.matchField}</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{result.data.name}</h3>
                        <p className="text-gray-600 mt-1 capitalize">{(result.data.role || '').replace('_', ' ')}</p>
                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span>{result.data.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{result.data.phoneNumber}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{result.data.department}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )}

                  {result.type === 'department' && (
                    <button
                      onClick={() => handleDepartmentClick(result.data.id)}
                      className="w-full flex items-start justify-between text-left hover:bg-gray-100 rounded-lg p-2 -m-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building className="h-5 w-5 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600 uppercase">Department</span>
                          <span className="text-xs text-gray-500">Match in: {result.matchField}</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{result.data.name}</h3>
                        <p className="text-gray-600 mt-1">Code: {result.data.code}</p>
                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span>{result.data.contactEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Head: {result.data.headOfDepartment}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
