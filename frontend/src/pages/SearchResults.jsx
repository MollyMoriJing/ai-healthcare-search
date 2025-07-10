import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import ProviderList from '../components/ProviderList';
import MapView from '../components/MapView';
import SearchForm from '../components/SearchForm';
import { FaList, FaMap, FaFilter, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const SearchResults = ({ user, onSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchData, setSearchData] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filters, setFilters] = useState({
    acceptingPatients: false,
    distance: 50,
    rating: 0,
    specialty: ''
  });
  const [mapCenter, setMapCenter] = useState(null);

  // Get search data from navigation state
  useEffect(() => {
    if (location.state?.searchData) {
      setSearchData(location.state.searchData);
      performSearch(location.state.searchData);
    } else {
      // Redirect to home if no search data
      navigate('/');
    }
  }, [location.state]);

  // Perform search
  const performSearch = async (searchParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post('/api/search/providers', searchParams);
      
      if (response.data) {
        setResults(response.data);
        
        // Set map center based on search location
        if (searchParams.location) {
          geocodeLocation(searchParams.location);
        }
        
        // Track search for user
        if (onSearch) {
          onSearch(searchParams);
        }
        
        toast.success(`Found ${response.data.providers.length} providers`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.message || 'Search failed. Please try again.');
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Geocode search location for map center
  const geocodeLocation = async (locationStr) => {
    try {
      if (window.google) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: locationStr }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            setMapCenter({
              lat: location.lat(),
              lng: location.lng()
            });
          }
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Handle new search
  const handleNewSearch = (newSearchData) => {
    setSearchData(newSearchData);
    performSearch(newSearchData);
  };

  // Handle provider click
  const handleProviderClick = (provider) => {
    navigate(`/provider/${provider.npi}`);
  };

  // Filter providers based on current filters
  const filteredProviders = results?.providers?.filter(provider => {
    if (filters.acceptingPatients && !provider.acceptingNewPatients) return false;
    if (filters.distance && provider.distance > filters.distance) return false;
    if (filters.rating && provider.rating < filters.rating) return false;
    if (filters.specialty && !provider.specialty.toLowerCase().includes(filters.specialty.toLowerCase())) return false;
    return true;
  }) || [];

  // Get urgency styling
  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Searching for providers...</h2>
          <p className="text-gray-600">Analyzing your symptoms and finding the best matches</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Search Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try New Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Refine Your Search</h2>
        <SearchForm
          onSearch={handleNewSearch}
          initialData={searchData}
          user={user}
          compact={true}
        />
      </div>

      {results && (
        <>
          {/* Analysis Results */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">AI Analysis Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`p-4 rounded-lg border ${getUrgencyStyle(results.analysis.urgency)}`}>
                <h3 className="font-semibold">Urgency Level</h3>
                <p className="text-lg capitalize">{results.analysis.urgency}</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800">Recommended Specialties</h3>
                <p className="text-sm text-blue-700">
                  {results.analysis.specialties.join(', ')}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800">Providers Found</h3>
                <p className="text-lg text-gray-700">{filteredProviders.length}</p>
              </div>
            </div>

            {/* Recommendations */}
            {results.analysis.recommendations && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Recommendations:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {results.analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medical Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Medical Disclaimer:</strong> {results.analysis.disclaimer}
              </p>
            </div>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaList className="mr-2" />
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaMap className="mr-2" />
                Map View
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="acceptingPatients"
                  checked={filters.acceptingPatients}
                  onChange={(e) => setFilters({...filters, acceptingPatients: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="acceptingPatients" className="text-sm">
                  Accepting New Patients
                </label>
              </div>
              
              <select
                value={filters.rating}
                onChange={(e) => setFilters({...filters, rating: parseFloat(e.target.value)})}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md">
            {viewMode === 'list' ? (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Healthcare Providers ({filteredProviders.length})
                </h2>
                <ProviderList
                  providers={filteredProviders}
                  onProviderClick={handleProviderClick}
                />
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Provider Locations ({filteredProviders.length})
                </h2>
                <MapView
                  providers={filteredProviders}
                  center={mapCenter}
                  onProviderClick={handleProviderClick}
                  isVisible={viewMode === 'map'}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;