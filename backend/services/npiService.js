const axios = require('axios');
const logger = require('../utils/logger');
const cacheService = require('./cache');

class NPIService {
  constructor() {
    this.baseURL = process.env.NPI_API_BASE_URL || 'https://npiregistry.cms.hhs.gov/api';
    this.version = process.env.NPI_API_VERSION || '2.1';
    this.timeout = 10000; // 10 seconds
    this.retryAttempts = 3;
  }

  async searchProviders({ location, radius = 25, specialties = [], insurance = '', limit = 20 }) {
    try {
      logger.info('Searching NPI registry', { location, radius, specialties, limit });

      const providers = [];
      
      // Search for each specialty
      for (const specialty of specialties.slice(0, 3)) { // Limit to 3 specialties
        const searchParams = {
          version: this.version,
          taxonomy_description: specialty,
          city: this.extractCity(location),
          state: this.extractState(location),
          limit: Math.min(limit, 50),
          enumeration_type: 'Individual'
        };

        const specialtyProviders = await this.performSearch(searchParams);
        providers.push(...specialtyProviders);
      }

      // Remove duplicates and process results
      const uniqueProviders = this.removeDuplicateProviders(providers);
      const enrichedProviders = await this.enrichProviderData(uniqueProviders);
      
      // Filter by location if provided
      let filteredProviders = enrichedProviders;
      if (location) {
        filteredProviders = this.filterByLocation(enrichedProviders, location, radius);
      }

      // Sort by relevance and rating
      filteredProviders.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        return b.rating - a.rating;
      });

      return filteredProviders.slice(0, limit);

    } catch (error) {
      logger.error('NPI search error:', error);
      throw new Error('Failed to search provider registry');
    }
  }

  async performSearch(params) {
    const retryDelays = [1000, 2000, 3000]; // Progressive delays
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseURL}/`, {
          params,
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Healthcare-Search-App/1.0',
            'Accept': 'application/json'
          }
        });

        if (response.data && response.data.results) {
          return response.data.results.map(this.transformNPIData);
        }
        
        return [];

      } catch (error) {
        logger.warn(`NPI API attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === this.retryAttempts - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      }
    }
  }

  transformNPIData(npiData) {
    const basic = npiData.basic || {};
    const addresses = npiData.addresses || [];
    const taxonomies = npiData.taxonomies || [];
    const practiceLocation = addresses.find(addr => addr.address_purpose === 'LOCATION') || addresses[0];
    
    return {
      npi: npiData.number,
      name: this.formatProviderName(basic),
      specialty: taxonomies[0]?.desc || 'General Practice',
      address: this.formatAddress(practiceLocation),
      phone: practiceLocation?.telephone_number || '',
      distance: null, // Will be calculated later
      rating: this.generateMockRating(),
      acceptingNewPatients: Math.random() > 0.3, // 70% accepting new patients
      education: this.generateMockEducation(),
      languages: this.generateMockLanguages(),
      insurance: this.generateMockInsurance(),
      availability: this.generateMockAvailability()
    };
  }

  formatProviderName(basic) {
    if (basic.organization_name) {
      return basic.organization_name;
    }
    
    const firstName = basic.first_name || '';
    const lastName = basic.last_name || '';
    const credential = basic.credential || '';
    
    return `${firstName} ${lastName}${credential ? ', ' + credential : ''}`.trim();
  }

  formatAddress(address) {
    if (!address) return '';
    
    return {
      street: `${address.address_1 || ''} ${address.address_2 || ''}`.trim(),
      city: address.city || '',
      state: address.state || '',
      zip: address.postal_code || '',
      full: `${address.address_1 || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}`.replace(/,\s*,/g, ',').trim()
    };
  }

  async getProviderByNPI(npi) {
    try {
      const cacheKey = `provider:details:${npi}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/`, {
        params: {
          version: this.version,
          number: npi
        },
        timeout: this.timeout
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const provider = this.transformNPIData(response.data.results[0]);
        const enriched = await this.enrichProviderData([provider]);
        
        await cacheService.set(cacheKey, enriched[0], 7200); // Cache for 2 hours
        return enriched[0];
      }

      return null;

    } catch (error) {
      logger.error('Provider details fetch error:', error);
      throw new Error('Failed to fetch provider details');
    }
  }

  async enrichProviderData(providers) {
    // In a real implementation, this would call additional APIs
    return providers.map(provider => ({
      ...provider,
      reviews: this.generateMockReviews(),
      certifications: this.generateMockCertifications(),
      hospitalAffiliations: this.generateMockHospitals()
    }));
  }

  removeDuplicateProviders(providers) {
    const seen = new Set();
    return providers.filter(provider => {
      const key = `${provider.npi}_${provider.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  filterByLocation(providers, location, radius) {
    // Simplified location filtering - in production, use proper geocoding
    const locationLower = location.toLowerCase();
    
    return providers.filter(provider => {
      if (!provider.address || !provider.address.full) return false;
      
      const providerLocation = provider.address.full.toLowerCase();
      
      // Simple text matching - in production, use geospatial queries
      if (providerLocation.includes(locationLower)) {
        provider.distance = Math.random() * radius; // Mock distance
        return true;
      }
      
      return false;
    });
  }

  extractCity(location) {
    if (!location) return '';
    const parts = location.split(',');
    return parts[0].trim();
  }

  extractState(location) {
    if (!location) return '';
    const parts = location.split(',');
    return parts[1] ? parts[1].trim().substring(0, 2) : '';
  }

  // Mock data generators for demo purposes
  generateMockRating() {
    return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0-5.0 range
  }

  generateMockEducation() {
    const schools = [
      'Harvard Medical School',
      'Johns Hopkins University',
      'Stanford University',
      'Mayo Clinic College of Medicine',
      'University of Pennsylvania',
      'Columbia University'
    ];
    return schools[Math.floor(Math.random() * schools.length)];
  }

  generateMockLanguages() {
    const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];
    const count = Math.floor(Math.random() * 3) + 1;
    return languages.slice(0, count);
  }

  generateMockInsurance() {
    const insurances = ['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'Humana', 'United Healthcare', 'Medicare', 'Medicaid'];
    const count = Math.floor(Math.random() * 4) + 2;
    return insurances.slice(0, count);
  }

  generateMockAvailability() {
    return {
      nextAvailable: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acceptingNewPatients: Math.random() > 0.3
    };
  }

  generateMockReviews() {
    const reviews = [];
    const count = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < count; i++) {
      reviews.push({
        rating: Math.floor(Math.random() * 5) + 1,
        comment: 'Great doctor, very professional and caring.',
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    
    return reviews;
  }

  generateMockCertifications() {
    const certs = ['Board Certified', 'Fellow of American College', 'Specialty Certification'];
    return certs.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  generateMockHospitals() {
    const hospitals = ['General Hospital', 'Medical Center', 'Regional Hospital', 'University Hospital'];
    return hospitals.slice(0, Math.floor(Math.random() * 2) + 1);
  }
}

module.exports = new NPIService();