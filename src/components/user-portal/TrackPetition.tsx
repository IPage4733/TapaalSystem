import React, { useState, useEffect } from 'react';
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

// API base URLs
const PETITION_API = 'https://ec8jdej696.execute-api.ap-southeast-1.amazonaws.com/dev/newpetition';
const TAPPAL_API = 'https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals';
const MOVEMENT_API = 'https://zq5wahnb2d.execute-api.ap-southeast-1.amazonaws.com/dev/forward';
const OFFICER_API = 'https://ls82unr468.execute-api.ap-southeast-1.amazonaws.com/dev/officer';

const TrackPetition: React.FC = () => {
  const [searchType, setSearchType] = useState<'petitionId' | 'mobile'>('petitionId');
  const [searchValue, setSearchValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [multipleResults, setMultipleResults] = useState<any[] | null>(null);

  // Normalize different tappal field names
  const normalizeTappalId = (petition: any) => {
    return petition?.tappleId || petition?.tappalId || petition?.tappleID || petition?.tappalID || '';
  };

  // human-friendly duration formatter
  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '0m';
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60) % 60;
    const hours = Math.floor(secs / 3600) % 24;
    const days = Math.floor(secs / 86400);

    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (mins) parts.push(`${mins}m`);
    if (parts.length === 0) return `${Math.floor(secs)}s`;
    return parts.join(' ');
  };

  // Fetch helpers
  const fetchPetitionById = async (petitionId: string) => {
    const res = await fetch(`${PETITION_API}/${encodeURIComponent(petitionId)}`);
    if (!res.ok) throw new Error(`Petition API error: ${res.status}`);
    return res.json();
  };

  const fetchPetitionsByPhone = async (phone: string) => {
    const res = await fetch(`${PETITION_API}/phone/${encodeURIComponent(phone)}`);
    if (!res.ok) throw new Error(`Petition-by-phone API error: ${res.status}`);
    return res.json();
  };

  const fetchTappals = async () => {
    const res = await fetch(TAPPAL_API);
    if (!res.ok) throw new Error(`Tappal API error: ${res.status}`);
    return res.json();
  };

  const fetchMovements = async () => {
    const res = await fetch(MOVEMENT_API);
    if (!res.ok) throw new Error(`Movement API error: ${res.status}`);
    return res.json();
  };

  const fetchOfficers = async () => {
    const res = await fetch(OFFICER_API);
    if (!res.ok) throw new Error(`Officer API error: ${res.status}`);
    return res.json();
  };

  const resolveOfficer = (tappal: any, officersList: any[]) => {
    if (!tappal || !officersList) return null;

    const assign = tappal.assignToOfficer || tappal.assignTo || tappal.assignedTo || tappal.officerId || tappal.assignToOfficerId;
    if (assign) {
      const byId = officersList.find(o => o.id === assign || o.employeeId === assign || o.id === String(assign));
      if (byId) return byId;
    }

    if (tappal.phoneNumber) {
      const cleaned = tappal.phoneNumber.replace(/\s|\+|-/g, '');
      const byPhone = officersList.find(o => (o.phone || o.mobile || '').replace(/\s|\+|-/g, '') === cleaned);
      if (byPhone) return byPhone;
    }

    if (tappal.officerName) {
      const byName = officersList.find(o => (o.fullName || o.name || '').toLowerCase() === tappal.officerName.toLowerCase());
      if (byName) return byName;
    }

    if (tappal.department) {
      const byDept = officersList.find(o => (o.department || '').toLowerCase() === (tappal.department || '').toLowerCase());
      if (byDept) return byDept;
    }

    return null;
  };

  const buildMovementsForTappal = (tappalId: string, movementsRaw: any[]) => {
    if (!tappalId || !Array.isArray(movementsRaw)) return [];
    const filtered = movementsRaw.filter(m => (m.tappalId || m.tappleId || '').toString() === tappalId.toString());
    const mapped = filtered.map((m: any, idx: number) => ({
      id: m.forwardId || `mv-${idx}`,
      tappalId: m.tappalId || m.tappleId || '',
      fromOfficerName: m.fromOfficerName || m.fromOfficer || m.fromName || 'Unknown',
      toOfficerName: m.toOfficerName || m.toOfficer || m.toName || 'Unknown',
      fromOfficerRole: m.fromOfficerRole || m.fromRole || 'clerk',
      toOfficerRole: m.toOfficerRole || m.toRole || 'clerk',
      reason: m.reason || m.remark || m.description || '',
      status: m.status || 'Received',
      timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
    }));
    mapped.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // compute duration each movement represents until the next movement timestamp
    for (let i = 0; i < mapped.length; i++) {
      const cur = mapped[i];
      const next = mapped[i + 1];
      const curTs = isNaN(new Date(cur.timestamp).getTime()) ? Date.now() : new Date(cur.timestamp).getTime();
      const nextTs = next && !isNaN(new Date(next.timestamp).getTime()) ? new Date(next.timestamp).getTime() : Date.now();
      const durationMs = Math.max(0, nextTs - curTs);
      cur.durationMs = durationMs;
      cur.durationHuman = formatDuration(durationMs);
    }

    return mapped;
  };

  const handleSearch = async () => {
    setError('');
    setSearchResult(null);
    setMultipleResults(null);

    if (!searchValue.trim()) {
      setError('Please enter a valid search value');
      return;
    }

    setIsSearching(true);

    try {
      // fetch tappals, movements and officers in parallel so we can show movement/officer info
      const [tappals, movementsRaw, officersPayload] = await Promise.all([
        fetchTappals().catch(() => []), // tolerate failures
        fetchMovements().catch(() => []),
        fetchOfficers().catch(() => ({ officers: [] }))
      ]);
      const officers = officersPayload?.officers || officersPayload || [];

      if (searchType === 'petitionId') {
        const petition = await fetchPetitionById(searchValue.trim());
        if (!petition) throw new Error('Petition not found');

        const tappalId = normalizeTappalId(petition) || petition.tappleId || petition.tappalId || '';
        const relatedTappal = tappalId ? (Array.isArray(tappals) ? tappals.find((t: any) => (t.tappalId || t.tappleId || '').toString() === tappalId.toString()) : null) : null;
        const movements = relatedTappal ? buildMovementsForTappal(relatedTappal.tappalId || relatedTappal.tappleId, movementsRaw) : [];
        const currentOfficer = relatedTappal ? resolveOfficer(relatedTappal, officers) : null;

        setSearchResult({ petition, tappal: relatedTappal, movements, currentOfficer });
      } else {
        const payload = await fetchPetitionsByPhone(searchValue.trim());
        const list = Array.isArray(payload?.data) ? payload.data : [];
        if (list.length === 0) throw new Error('No petitions found for this mobile number.');

        list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const chosen = list[0];

        if (chosen.confidential && otpValue !== '123456') {
          setShowOtpField(true);
          setMultipleResults(list);
          setIsSearching(false);
          return;
        }

        const tappalId = normalizeTappalId(chosen);
        const relatedTappal = tappalId ? (Array.isArray(tappals) ? tappals.find((t: any) => (t.tappalId || t.tappleId || '').toString() === tappalId.toString()) : null) : null;
        const movements = relatedTappal ? buildMovementsForTappal(relatedTappal.tappalId || relatedTappal.tappleId, movementsRaw) : [];
        const currentOfficer = relatedTappal ? resolveOfficer(relatedTappal, officers) : null;

        setSearchResult({ petition: chosen, tappal: relatedTappal, movements, currentOfficer });

        if (list.length > 1) setMultipleResults(list);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleOtpVerification = () => {
    if (otpValue === '123456') {
      setShowOtpField(false);
      handleSearch();
    } else {
      setError('Invalid OTP.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'tappal generated':
      case 'active':
      case 'forwarded':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'under review':
      case 'in progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPetitionStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
      case 'complete':
        return 'text-green-600 bg-green-100';
      case 'tappal generated':
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'under review':
      case 'in progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'submitted':
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      case 'rejected':
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
    if (!role) return '';
    return roleNames[role.toLowerCase()] || role;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Petition</h1>
        <p className="text-gray-600">Enter your Petition ID or mobile number to check the current status</p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Search by:</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{searchType === 'petitionId' ? 'Petition ID' : 'Mobile Number'}</label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={searchType === 'petitionId' ? 'e.g., PET-20251105-430' : 'e.g., 9876543210'}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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

          {showOtpField && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-2">OTP Verification Required</p>
                  <p className="text-sm text-yellow-700 mb-3">This petition contains sensitive information. Please enter the OTP sent to your mobile number.</p>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      className="px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                    <button onClick={handleOtpVerification} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">Verify</button>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">Demo OTP: 123456</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Demo Instructions:</p>
                <p>• Try Petition ID: <code className="bg-blue-100 px-1 rounded">PET-20251105-430</code></p>
                <p>• Try Mobile: <code className="bg-blue-100 px-1 rounded">9876543210</code></p>
                <p>• For confidential petitions, use OTP: <code className="bg-blue-100 px-1 rounded">123456</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {searchResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{searchResult.petition.subject || 'No subject provided'}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1"><FileText className="h-4 w-4" /><span>{searchResult.petition.petitionId || '-'}</span></div>
                  <div className="flex items-center space-x-1"><Calendar className="h-4 w-4" /><span>Submitted: {formatDate(searchResult.petition.createdAt)}</span></div>
                  <div className="flex items-center space-x-1"><Building className="h-4 w-4" /><span>{searchResult.petition.departmentName || '—'}</span></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(searchResult.petition.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPetitionStatusColor(searchResult.petition.status)}`}>{searchResult.petition.status || 'Unknown'}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">{searchResult.petition.description || 'No description provided.'}</p>
            </div>

            {/* Current assignment block (always present) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Current Assignment</p>

                  {searchResult.tappal ? (
                    <>
                      <p className="text-blue-800">Tappal: <span className="font-medium text-gray-900">{searchResult.tappal.tappalId || searchResult.tappal.tappalId || searchResult.tappal.tappalId}</span></p>
                      <p className="text-blue-800">Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(searchResult.tappal.status)}`}>{searchResult.tappal.status || 'Unknown'}</span></p>

                      {searchResult.currentOfficer ? (
                        <p className="text-blue-800 mt-1">With: <span className="font-medium text-gray-900">{searchResult.currentOfficer.fullName || searchResult.currentOfficer.name}</span> — {getRoleDisplayName(searchResult.currentOfficer.role || '')}</p>
                      ) : (
                        <p className="text-sm text-blue-700 mt-1 italic">No officer assigned to this tappal yet.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-blue-700">No tappal generated for this petition.</p>
                      <p className="text-sm text-blue-700 mt-1 italic">If this petition should have been forwarded, please contact the helpline.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Extra details (always present) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Petitioner</p>
                <p className="font-medium text-gray-900">{searchResult.petition.fullName || searchResult.petition.petitionerName || '—'}</p>
                <p className="text-sm text-gray-600">{searchResult.petition.mobileNumber || searchResult.petition.phoneNumber || '—'}</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Due Date</p>
                <p className="font-medium text-gray-900">{searchResult.petition.dueDate ? formatDate(searchResult.petition.dueDate) : '—'}</p>
                <p className="text-sm text-gray-600">Priority: {searchResult.tappal?.priority || '—'}</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Attachments</p>
                {Array.isArray(searchResult.petition.attachments) && searchResult.petition.attachments.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {searchResult.petition.attachments.map((a: string, i: number) => (
                      <li key={i}><a href={a} target="_blank" rel="noreferrer" className="underline">{a.split('/').pop()}</a></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No attachments</p>
                )}
              </div>
            </div>
          </div>

          {/* Movement timeline - always shown; friendly message if empty */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Processing Timeline</h3>

            {Array.isArray(searchResult.movements) && searchResult.movements.length > 0 ? (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="space-y-6">
                  {searchResult.movements.map((movement: any) => (
                    <div key={movement.id} className="relative flex items-start space-x-6">
                      <div className="relative z-10">
                        <div className={`w-3 h-3 rounded-full border-2 ${movement.status === 'Processed' ? 'bg-green-500 border-green-500' : movement.status === 'Received' ? 'bg-blue-500 border-blue-500' : 'bg-yellow-500 border-yellow-500'}`}></div>
                      </div>

                      <div className="flex-1 min-w-0 pb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${movement.status === 'Processed' ? 'bg-green-100 text-green-800' : movement.status === 'Received' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{movement.status}</span>
                            <span className="text-sm text-gray-500">{formatDateTime(movement.timestamp)}</span>
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
                            <p className="text-sm text-gray-700">{movement.reason || '—'}</p>

                            {/* duration held until next forward */}
                            {movement.durationHuman && (
                              <p className="text-xs text-gray-500 mt-2">
                                Time with {movement.toOfficerName || 'officer'}: <span className="font-medium text-gray-700" title={`${movement.durationMs || 0} ms`}>{movement.durationHuman}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current Position */}
                  <div className="relative flex items-start space-x-6">
                    <div className="relative z-10"><div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-blue-600 animate-pulse"></div></div>
                    <div className="flex-1">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="font-medium text-blue-900">Current Position</span></div>
                        <p className="text-blue-800">With {searchResult.currentOfficer?.fullName || searchResult.currentOfficer?.name || 'Not assigned'} ({getRoleDisplayName(searchResult.currentOfficer?.role || '') || '—'})</p>
                        <p className="text-sm text-blue-700 mt-1">Status: {searchResult.tappal?.status || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
                <p className="font-medium mb-2">No movements recorded for this petition yet.</p>
                <p className="text-sm">If you think this is an error, contact the helpline or visit the office.</p>
              </div>
            )}
          </div>

          {/* Contact Info - always visible with placeholder text when empty */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{searchResult.currentOfficer?.fullName || searchResult.currentOfficer?.name || 'No officer assigned'}</p>
                  <p className="text-sm text-gray-600">{searchResult.currentOfficer?.department || searchResult.tappal?.department || '—'}</p>
                  <p className="text-sm text-gray-600">{searchResult.currentOfficer?.phone || searchResult.currentOfficer?.phoneNumber || searchResult.tappal?.phoneNumber || '—'}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p>For any queries regarding your petition, you may contact the above officer during office hours. If no officer is assigned yet, contact the helpline.</p>
              </div>
            </div>
          </div>

          {/* Help */}
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

      {/* Multiple results list if phone-search returned more than one */}
      {multipleResults && multipleResults.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-semibold mb-3">Other petitions for this number</h4>
          <ul className="space-y-2">
            {multipleResults.map((p: any) => (
              <li key={p.petitionId || p.petitionId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <div className="text-sm font-medium">{p.subject}</div>
                  <div className="text-xs text-gray-500">{p.petitionId} • {formatDate(p.createdAt)}</div>
                </div>
                <div className="text-sm text-gray-600">{p.status}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackPetition;
