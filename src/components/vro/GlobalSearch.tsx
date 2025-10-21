import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { 
  Search, 
  FileText, 
  User, 
  Building, 
  Calendar,
  ExternalLink,
  Filter
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { formatDate, getStatusColor } from '../../utils/dateUtils';

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results: any[] = [];

    // Search in tappals (scope limited to VRO's assigned tappals)
    if (searchType === 'all' || searchType === 'tappal') {
      const myTappals = mockTappals.filter(t => t.assignedTo === user?.id);
      
      myTappals.forEach(tappal => {
        if (
          tappal.tappalId.toLowerCase().includes(term) ||
          tappal.subject.toLowerCase().includes(term) ||
          tappal.description.toLowerCase().includes(term) ||
          tappal.departmentName.toLowerCase().includes(term) ||
          (tappal.petitionId && tappal.petitionId.toLowerCase().includes(term))
        ) {
          results.push({
            type: 'tappal',
            data: tappal,
            matchField: getMatchField(tappal, term)
          });
        }
      });
    }

    return results;
  }, [searchTerm, searchType, user]);

  const getMatchField = (tappal: any, term: string) => {
    if (tappal.tappalId.toLowerCase().includes(term)) return 'Tappal ID';
    if (tappal.petitionId?.toLowerCase().includes(term)) return 'Petition ID';
    if (tappal.subject.toLowerCase().includes(term)) return 'Subject';
    if (tappal.departmentName.toLowerCase().includes(term)) return 'Department';
    return 'Description';
  };

  const searchTypeOptions = [
    { value: 'all', label: 'All Records' },
    { value: 'tappal', label: 'My Tappals Only' }
  ];

  const handleTappalClick = (tappalId: string) => {
    navigate(`/tappal/${tappalId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search</h1>
        <p className="text-gray-600">Search across your assigned tappals</p>
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
                      ? 'bg-cyan-100 text-cyan-700'
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
              placeholder="Search by Tappal ID, Petition ID, Subject, Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Search Tips */}
          <div className="bg-cyan-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-cyan-800 mb-2">Search Tips:</h3>
            <ul className="text-sm text-cyan-700 space-y-1">
              <li>• Search by Tappal ID (e.g., TAP-2025-001)</li>
              <li>• Search by Petition ID (e.g., PET-2025-001)</li>
              <li>• Search by subject or description keywords</li>
              <li>• Search by department name</li>
              <li>• Use partial matches for broader results</li>
              <li>• Search scope limited to your assigned tappals</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchTerm.trim() && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.length > 0 && (
              <span className="text-sm text-gray-500">
                Showing results for "{searchTerm}" in your tappals
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-5 w-5 text-cyan-600" />
                        <span className="text-xs font-medium text-cyan-600 uppercase">Tappal</span>
                        <span className="text-xs text-gray-500">Match in: {result.matchField}</span>
                      </div>
                      <button
                        onClick={() => handleTappalClick(result.data.tappalId)}
                        className="text-lg font-medium text-gray-900 hover:text-cyan-600 flex items-center space-x-1"
                      >
                        <span>{result.data.tappalId}</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <p className="text-gray-600 mt-1">{result.data.subject}</p>
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
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