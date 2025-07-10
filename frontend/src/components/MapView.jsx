import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaPhone, FaStar, FaTimes } from 'react-icons/fa';

const MapView = ({ providers, center, onProviderClick, isVisible }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoading(false);
      };
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoading && !error && window.google && mapRef.current && isVisible) {
      const mapOptions = {
        center: center || { lat: 47.6062, lng: -122.3321 }, // Default to Seattle
        zoom: 12,
        styles: [
          {
            featureType: 'poi.medical',
            elementType: 'geometry',
            stylers: [{ color: '#ffeaa7' }]
          },
          {
            featureType: 'poi.medical',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9b870c' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      // Create InfoWindow
      const newInfoWindow = new window.google.maps.InfoWindow();
      setInfoWindow(newInfoWindow);
    }
  }, [isLoading, error, center, isVisible]);

  // Add markers for providers
  useEffect(() => {
    if (map && providers && providers.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = [];
      const bounds = new window.google.maps.LatLngBounds();

      providers.forEach((provider, index) => {
        geocodeProvider(provider).then(position => {
          if (position) {
            const marker = new window.google.maps.Marker({
              position,
              map,
              title: provider.name,
              icon: {
                url: getMarkerIcon(provider.specialty),
                scaledSize: new window.google.maps.Size(40, 40),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(20, 40)
              },
              animation: window.google.maps.Animation.DROP
            });

            marker.addListener('click', () => {
              setSelectedProvider(provider);
              showInfoWindow(marker, provider);
              if (onProviderClick) {
                onProviderClick(provider);
              }
            });

            newMarkers.push(marker);
            bounds.extend(position);
          }
        });
      });

      setMarkers(newMarkers);

      // Fit map to show all markers
      if (providers.length > 1) {
        map.fitBounds(bounds);
      }
    }
  }, [map, providers]);

  // Geocode provider address
  const geocodeProvider = async (provider) => {
    if (!provider.address || !provider.address.full) return null;

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve) => {
        geocoder.geocode(
          { address: provider.address.full },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].geometry.location);
            } else {
              console.warn(`Geocoding failed for ${provider.name}:`, status);
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Get marker icon based on specialty
  const getMarkerIcon = (specialty) => {
    const specialtyColors = {
      'Cardiology': '#e74c3c',
      'Dermatology': '#f39c12',
      'Neurology': '#9b59b6',
      'Orthopedics': '#3498db',
      'Family Medicine': '#2ecc71',
      'Internal Medicine': '#1abc9c',
      'Emergency Medicine': '#e67e22',
      'Pediatrics': '#ff69b4',
      'Psychiatry': '#8e44ad',
      'Surgery': '#c0392b'
    };

    const color = specialtyColors[specialty] || '#34495e';
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="15" fill="${color}" stroke="white" stroke-width="3"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">+</text>
      </svg>
    `)}`;
  };

  // Show info window
  const showInfoWindow = (marker, provider) => {
    if (infoWindow) {
      const content = `
        <div class="p-3 max-w-sm">
          <h3 class="font-bold text-lg mb-2">${provider.name}</h3>
          <p class="text-blue-600 font-medium mb-2">${provider.specialty}</p>
          <p class="text-gray-600 text-sm mb-2">
            <i class="fas fa-map-marker-alt mr-1"></i>
            ${provider.address.full}
          </p>
          <p class="text-gray-600 text-sm mb-2">
            <i class="fas fa-phone mr-1"></i>
            ${provider.phone || 'Phone not available'}
          </p>
          <div class="flex items-center mb-2">
            <i class="fas fa-star text-yellow-400 mr-1"></i>
            <span class="text-sm font-medium">${provider.rating || 'N/A'}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs px-2 py-1 rounded ${
              provider.acceptingNewPatients 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }">
              ${provider.acceptingNewPatients ? 'Accepting Patients' : 'Not Accepting'}
            </span>
            ${provider.distance ? `<span class="text-xs text-gray-500">${provider.distance.toFixed(1)} miles</span>` : ''}
          </div>
        </div>
      `;
      
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    }
  };

  // Handle map toggle
  const handleClose = () => {
    if (infoWindow) {
      infoWindow.close();
    }
    setSelectedProvider(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-1">
            Please check your Google Maps API configuration
          </p>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded"
            title="Close Info Window"
          >
            <FaTimes className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Provider Specialties</h4>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Cardiology</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
            <span>Dermatology</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
            <span>Neurology</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Orthopedics</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Family Med</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-600 rounded-full mr-1"></div>
            <span>Other</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;