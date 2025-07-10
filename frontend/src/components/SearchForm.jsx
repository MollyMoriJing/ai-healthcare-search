import React, { useState, useEffect } from 'react';
import { FaSearch, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';

const SearchForm = ({ onSearch, isLoading, user }) => {
  const [formData, setFormData] = useState({
    symptoms: '',
    location: '',
    radius: '25',
    insurance: '',
    urgency: 'normal'
  });

  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        location: user.location || prev.location,
        insurance: user.insurance || prev.insurance
      }));
    }
  }, [user]);

  // Symptom suggestions
  const commonSymptoms = [
    'headache and nausea',
    'chest pain and shortness of breath',
    'persistent cough',
    'abdominal pain',
    'back pain',
    'fatigue and weakness',
    'fever and chills',
    'joint pain and swelling',
    'skin rash',
    'dizziness and lightheadedness',
    'anxiety and depression',
    'sleep problems',
    'digestive issues',
    'vision problems',
    'hearing loss'
  ];

  const insuranceOptions = [
    'Aetna',
    'Anthem Blue Cross Blue Shield',
    'Cigna',
    'Humana',
    'Kaiser Permanente',
    'Medicare',
    'Medicaid',
    'UnitedHealthcare',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Show suggestions for symptoms
    if (name === 'symptoms' && value.length > 2) {
      const filtered = commonSymptoms.filter(symptom =>
        symptom.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      symptoms: suggestion
    }));
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = 'Please describe your symptoms';
    } else if (formData.symptoms.length < 10) {
      newErrors.symptoms = 'Please provide more details about your symptoms';
    } else if (formData.symptoms.length > 500) {
      newErrors.symptoms = 'Symptom description is too long (max 500 characters)';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Please enter your location';
    }

    const radius = parseInt(formData.radius);
    if (isNaN(radius) || radius < 1 || radius > 100) {
      newErrors.radius = 'Radius must be between 1 and 100 miles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSearch(formData);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, reverse geocode to get city/state
          setFormData(prev => ({
            ...prev,
            location: 'Current Location'
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto" id="search-form">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symptoms Input */}
        <div className="relative">
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Symptoms *
          </label>
          <div className="relative">
            <textarea
              id="symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.symptoms ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., I've been having persistent headaches with nausea for the past week, especially in the morning..."
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {formData.symptoms.length}/500
            </div>
          </div>
          {errors.symptoms && (
            <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>
          )}
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location and Radius */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="City, State or ZIP code"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="absolute right-2 top-2 px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              >
                Use Current
              </button>
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
              Radius (miles)
            </label>
            <select
              id="radius"
              name="radius"
              value={formData.radius}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.radius ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
            </select>
            {errors.radius && (
              <p className="mt-1 text-sm text-red-600">{errors.radius}</p>
            )}
          </div>
        </div>

        {/* Insurance and Urgency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Provider (Optional)
            </label>
            <select
              id="insurance"
              name="insurance"
              value={formData.insurance}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select your insurance</option>
              {insuranceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <FaSearch className="mr-2" />
                Find Healthcare Providers
              </>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg">
          <p>
            <strong>Medical Disclaimer:</strong> This search tool is for informational purposes only and does not constitute medical advice. 
            Always consult with qualified healthcare professionals for medical diagnosis and treatment. 
            In case of medical emergency, call 911 immediately.
          </p>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;