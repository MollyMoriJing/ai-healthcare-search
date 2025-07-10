import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SearchForm from '../components/SearchForm';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';
import { FaStethoscope, FaMapMarkerAlt, FaClock, FaShieldAlt, FaRobot, FaUsers } from 'react-icons/fa';

const Home = ({ user, searchHistory, onSearch }) => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Load recent searches
    setRecentSearches(searchHistory.slice(0, 3));
  }, [searchHistory]);

  const handleSearch = async (searchData) => {
    try {
      setIsSearching(true);
      
      // Add timestamp and user info to search data
      const enhancedSearchData = {
        ...searchData,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
      };

      // Update search history
      onSearch(enhancedSearchData);

      // Navigate to results page with search data
      navigate('/search', { 
        state: { searchData: enhancedSearchData } 
      });

    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRecentSearch = (searchData) => {
    navigate('/search', { state: { searchData } });
  };

  const features = [
    {
      icon: <FaRobot className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Analysis",
      description: "Our advanced AI analyzes your symptoms to suggest the most appropriate medical specialties and providers."
    },
    {
      icon: <FaStethoscope className="w-8 h-8 text-green-600" />,
      title: "Verified Providers",
      description: "Access real-time data from the National Provider Identifier (NPI) registry to find licensed healthcare professionals."
    },
    {
      icon: <FaMapMarkerAlt className="w-8 h-8 text-red-600" />,
      title: "Location-Based Search",
      description: "Find healthcare providers near you with customizable radius settings and distance calculations."
    },
    {
      icon: <FaClock className="w-8 h-8 text-purple-600" />,
      title: "Real-Time Availability",
      description: "Check provider availability, appointment slots, and whether they're accepting new patients."
    },
    {
      icon: <FaShieldAlt className="w-8 h-8 text-orange-600" />,
      title: "Privacy First",
      description: "Your health information is never stored. All searches are processed securely and anonymously."
    },
    {
      icon: <FaUsers className="w-8 h-8 text-indigo-600" />,
      title: "Community Reviews",
      description: "Read reviews and ratings from other patients to make informed decisions about your healthcare."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Philadelphia, PA",
      rating: 5,
      comment: "Found the perfect dermatologist for my skin concerns. The AI analysis was spot-on and saved me so much time!"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find the Right Healthcare Provider with
            <span className="text-blue-600"> AI-Powered Search</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Describe your symptoms and let our intelligent system connect you with the most suitable 
            healthcare providers in your area. Fast, accurate, and completely confidential.
          </p>
          
          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <SearchForm 
              onSearch={handleSearch} 
              isLoading={isSearching}
              user={user}
            />
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearch(search)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {search.symptoms.substring(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">50,000+</div>
              <div className="text-gray-600">Healthcare Providers</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Healthcare Search Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Describe Symptoms</h3>
              <p className="text-gray-600">Tell us about your symptoms, concerns, or health needs in natural language.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI analyzes your input and suggests the most appropriate medical specialties.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Providers</h3>
              <p className="text-gray-600">Get a curated list of qualified healthcare providers in your area.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Find Your Healthcare Provider?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of users who have found the right healthcare provider using our AI-powered search.
          </p>
          <button 
            onClick={() => document.querySelector('#search-form').scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Search Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;