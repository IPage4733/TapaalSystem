import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Shield
} from 'lucide-react';
import { formatDate, formatDateTime, getStatusColor } from '../../utils/dateUtils';

// ---------- CONFIG ----------
const BASE_URL = 'https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition';
const DEPT_BASE = 'https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew';
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  // 'Authorization': 'Bearer <token>',
};
// ----------------------------

const TrackPetition: React.FC = () => {
  const [searchType, setSearchType] = useState<'petitionId' | 'mobile'>('petitionId');
  const [searchValue, setSearchValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchList, setSearchList] = useState<any[] | null>(null); // for phone -> multiple results
  const [error, setError] = useState('');

  // Simple in-memory cache for department lookups to avoid repeated network calls
  const deptCache: Record<string, any> = (globalThis as any).__deptCache || ((globalThis as any).__deptCache = {});

  const mapPetitionToSearchResult = (petitionApiResponse: any) => {
    return {
      petition: {
        petitionId: petitionApiResponse.petitionId,
        subject: petitionApiResponse.subject,
        description: petitionApiResponse.description,
        fullName: petitionApiResponse.fullName,
        petitionerPhone: petitionApiResponse.mobileNumber || petitionApiResponse.mobile,
        aadharNumber: petitionApiResponse.aadharNumber,
        address: petitionApiResponse.address,
        attachments: petitionApiResponse.attachments || [],
        status: petitionApiResponse.status || petitionApiResponse.petitionStatus || 'Submitted',
        createdAt: petitionApiResponse.createdAt,
        dueDate: petitionApiResponse.dueDate,
        // departmentName will be filled later by fetchDepartment if only id is present
        departmentName: petitionApiResponse.departmentName || '',
        departmentId: petitionApiResponse.department || petitionApiResponse.departmentId || '',
        isConfidential: petitionApiResponse.isConfidential || false
      },
      tappal: null,
      movements: [],
      currentOfficer: null
    };
  };

  const fetchByPetitionId = async (petitionId: string) => {
    const url = `${BASE_URL}/${encodeURIComponent(petitionId)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server responded ${res.status}${text ? `: ${text}` : ''}`);
    }
    return res.json();
  };

  const fetchByPhone = async (phone: string) => {
    const url = `${BASE_URL}/phone/${encodeURIComponent(phone)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server responded ${res.status}${text ? `: ${text}` : ''}`);
    }
    return res.json();
  };

  const fetchDepartment = async (deptId: string) => {
    if (!deptId) return null;
    // return cached if available
    if (deptCache[deptId]) return deptCache[deptId];

    const url = `${DEPT_BASE}/${encodeURIComponent(deptId)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Dept API ${res.status}${text ? `: ${text}` : ''}`);
    }
    const data = await res.json();
    deptCache[deptId] = data;
    return data;
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a valid search value');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResult(null);
    setSearchList(null);

    try {
      if (searchType === 'petitionId') {
        const data = await fetchByPetitionId(searchValue.trim());
        const sr = mapPetitionToSearchResult(data);

        // if petition contains department ID, resolve its name
        const deptId = sr.petition.departmentId;
        if (deptId) {
          try {
            const dept = await fetchDepartment(deptId);
            if (dept && dept.departmentName) sr.petition.departmentName = dept.departmentName;
          } catch (dErr: any) {
            console.warn('Failed to fetch dept', dErr);
            // don't block user if dept lookup fails — show petition anyway
          }
        }

        if (sr.petition.isConfidential && !otpValue) {
          setShowOtpField(true);
          setIsSearching(false);
          return;
        }
        setSearchResult(sr);
      } else {
        // mobile search
        const data = await fetchByPhone(searchValue.trim());
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        if (list.length === 0) {
          setError('No petitions found for this phone number.');
        } else if (list.length === 1) {
          // single -> map and fetch dept if needed
          const sr = mapPetitionToSearchResult(list[0]);
          const deptId = sr.petition.departmentId;
          if (deptId) {
            try {
              const dept = await fetchDepartment(deptId);
              if (dept && dept.departmentName) sr.petition.departmentName = dept.departmentName;
            } catch (dErr: any) {
              console.warn('Dept fetch failed', dErr);
            }
          }
          if (sr.petition.isConfidential && !otpValue) {
            setShowOtpField(true);
            setIsSearching(false);
            return;
          }
          setSearchResult(sr);
        } else {
          // multiple => show list. We'll resolve department when user selects an item.
          setSearchList(list);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch. Check CORS / network / base URL.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleOtpVerification = () => {
    if (otpValue === '123456') {
      setShowOtpField(false);
      handleSearch();
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  const selectFromList = async (item: any) => {
    // When user selects an item from phone search results, resolve its dept then show full view
    const sr = mapPetitionToSearchResult(item);
    const deptId = sr.petition.departmentId;
    if (deptId) {
      try {
        const dept = await fetchDepartment(deptId);
        if (dept && dept.departmentName) sr.petition.departmentName = dept.departmentName;
      } catch (dErr: any) {
        console.warn('Dept fetch failed', dErr);
      }
    }
    setSearchList(null);
    setSearchResult(sr);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Tappal Generated':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'Under Review':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPetitionStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'text-green-600 bg-green-100';
      case 'Tappal Generated':
        return 'text-blue-600 bg-blue-100';
      case 'Under Review':
        return 'text-yellow-600 bg-yellow-100';
      case 'Submitted':
        return 'text-gray-600 bg-gray-100';
      case 'Rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      collector: 'District Collector',
      joint_collector: 'Joint Collector',
      dro: 'District Revenue Officer',
      rdo: 'Revenue Divisional Officer',
      tahsildar: 'Tahsildar',
      naib_tahsildar: 'Naib Tahsildar',
      ri: 'Revenue Inspector',
      vro: 'Village Revenue Officer',
      clerk: 'Clerk'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Petition</h1>
        <p className="text-gray-600">Enter your Petition ID or mobile number to check the current status</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          {/* Search Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search by:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="petitionId"
                  checked={searchType === 'petitionId'}
                  onChange={(e) => setSearchType(e.target.value as 'petitionId')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Petition ID</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mobile"
                  checked={searchType === 'mobile'}
                  onChange={(e) => setSearchType(e.target.value as 'mobile')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mobile Number</span>
              </label>
            </div>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {searchType === 'petitionId' ? 'Petition ID' : 'Mobile Number'}
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={searchType === 'petitionId' ? 'e.g., PET-20251101-787' : 'e.g., 9876543210'}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OTP Field */}
          {showOtpField && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    OTP Verification Required
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    This petition contains sensitive information. Please enter the OTP sent to your mobile number.
                  </p>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      className="px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                    <button
                      onClick={handleOtpVerification}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">Demo OTP: 123456</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Demo Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Demo Instructions:</p>
                <p>• Try Petition ID: <code className="bg-blue-100 px-1 rounded">PET-20251101-787</code></p>
                <p>• Try Mobile: <code className="bg-blue-100 px-1 rounded">9876543210</code></p>
                <p>• For confidential petitions, use OTP: <code className="bg-blue-100 px-1 rounded">123456</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* If phone search returned multiple results, show list to choose */}
      {searchList && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Multiple petitions found — choose one</h3>
          <div className="space-y-3">
            {searchList.map((it, idx) => (
              <div key={it.petitionId || idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{it.subject}</div>
                  <div className="text-xs text-gray-500">{it.petitionId} • {formatDate(it.createdAt)}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => selectFromList(it)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="space-y-6">
          {/* Petition Info */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{searchResult.petition.subject}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{searchResult.petition.petitionId}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Submitted: {formatDate(searchResult.petition.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{searchResult.petition.departmentName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(searchResult.petition.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPetitionStatusColor(searchResult.petition.status)}`}>
                  {searchResult.petition.status}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">{searchResult.petition.description}</p>
            </div>

            {/* Current Status (only if we have tappal and officer) */}
            {searchResult.tappal && searchResult.currentOfficer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Currently with:</p>
                    <p className="text-blue-800">
                      {searchResult.currentOfficer.name} - {getRoleDisplayName(searchResult.currentOfficer.role)}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(searchResult.tappal.status)}`}>
                        {searchResult.tappal.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Movement Timeline */}
          {searchResult.movements && searchResult.movements.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Processing Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="space-y-6">
                  {searchResult.movements.map((movement: any, index: number) => (
                    <div key={movement.id || index} className="relative flex items-start space-x-6">
                      <div className="relative z-10">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          movement.status === 'Processed' 
                            ? 'bg-green-500 border-green-500' 
                            : movement.status === 'Received'
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-yellow-500 border-yellow-500'
                        }`}></div>
                      </div>

                      <div className="flex-1 min-w-0 pb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              movement.status === 'Processed' 
                                ? 'bg-green-100 text-green-800' 
                                : movement.status === 'Received'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {movement.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(movement.timestamp)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">FROM</p>
                              <p className="font-medium text-gray-900">{movement.fromOfficerName}</p>
                              <p className="text-sm text-gray-600">{getRoleDisplayName(movement.fromOfficerRole)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">TO</p>
                              <p className="font-medium text-gray-900">{movement.toOfficerName}</p>
                              <p className="text-sm text-gray-600">{getRoleDisplayName(movement.toOfficerRole)}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">REMARKS</p>
                            <p className="text-sm text-gray-700">{movement.reason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current Position */}
                  <div className="relative flex items-start space-x-6">
                    <div className="relative z-10">
                      <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-blue-600 animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Current Position</span>
                        </div>
                        <p className="text-blue-800">
                          With {searchResult.currentOfficer?.name} ({getRoleDisplayName(searchResult.currentOfficer?.role || '')})
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Status: {searchResult.tappal?.status}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {searchResult.currentOfficer && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{searchResult.currentOfficer.name}</p>
                    <p className="text-sm text-gray-600">{getRoleDisplayName(searchResult.currentOfficer.role)}</p>
                    <p className="text-sm text-gray-600">{searchResult.currentOfficer.department}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>For any queries regarding your petition, you may contact the above officer during office hours.</p>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-gray-800 text-white rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Phone className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Call Helpline</h4>
                <p className="text-gray-300">1800-XXX-XXXX</p>
                <p className="text-sm text-gray-400">Mon-Fri, 9 AM - 6 PM</p>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Visit Office</h4>
                <p className="text-gray-300">District Collectorate</p>
                <p className="text-sm text-gray-400">Mon-Fri, 10 AM - 5 PM</p>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Processing Time</h4>
                <p className="text-gray-300">Up to 30 days</p>
                <p className="text-sm text-gray-400">As per government norms</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPetition;
