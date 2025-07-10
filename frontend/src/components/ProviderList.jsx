import React from 'react';
import { FaPhone, FaMapMarkerAlt, FaStar, FaUserMd } from 'react-icons/fa';

const ProviderList = ({ providers, onProviderClick }) => {
  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-8">
        <FaUserMd className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No providers found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <div
          key={provider.npi}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onProviderClick(provider)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {provider.name}
              </h3>
              <p className="text-blue-600 font-medium mb-2">{provider.specialty}</p>
              
              <div className="flex items-center text-gray-600 mb-2">
                <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                <span className="text-sm">{provider.address?.full}</span>
                {provider.distance && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {provider.distance.toFixed(1)} miles
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-gray-600 mb-3">
                <FaPhone className="h-4 w-4 mr-2" />
                <span className="text-sm">{provider.phone}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FaStar className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{provider.rating}</span>
                </div>
                
                <span className={`text-sm px-2 py-1 rounded ${
                  provider.acceptingNewPatients 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {provider.acceptingNewPatients ? 'Accepting Patients' : 'Not Accepting'}
                </span>
              </div>
            </div>
            
            <div className="ml-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProviderList;