const request = require('supertest');
const app = require('../app');
const gptService = require('../services/gptService');
const npiService = require('../services/npiService');
const cacheService = require('../services/cache');

// Mock services
jest.mock('../services/gptService');
jest.mock('../services/npiService');
jest.mock('../services/cache');

describe('Search API', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock cache service
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(true);
  });

  describe('POST /api/search/providers', () => {
    const validSearchPayload = {
      symptoms: 'I have been experiencing chest pain and shortness of breath',
      location: 'Philadelphia, PA',
      radius: 25,
      insurance: 'Aetna'
    };

    it('should return search results for valid input', async () => {
      // Mock GPT service response
      gptService.analyzeSymptoms.mockResolvedValue({
        success: true,
        urgency: 'high',
        specialties: ['cardiology', 'emergency medicine'],
        recommendations: ['Seek immediate medical attention', 'Consider going to emergency room'],
        reasoning: 'Chest pain and shortness of breath can indicate serious cardiac conditions'
      });

      // Mock NPI service response
      const mockProviders = [
        {
          npi: '1234567890',
          name: 'Dr. John Smith, MD',
          specialty: 'Cardiology',
          address: {
            street: '123 Main St',
            city: 'Philadelphia',
            state: 'PA',
            zip: '19101',
            full: '123 Main St, Philadelphia, PA 19101'
          },
          phone: '(555) 123-4567',
          distance: 2.5,
          rating: 4.8,
          acceptingNewPatients: true
        }
      ];
      npiService.searchProviders.mockResolvedValue(mockProviders);

      const response = await request(app)
        .post('/api/search/providers')
        .send(validSearchPayload)
        .expect(200);

      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('providers');
      expect(response.body.analysis.urgency).toBe('high');
      expect(response.body.providers).toHaveLength(1);
      expect(response.body.providers[0].npi).toBe('1234567890');
    });

    it('should return 400 for missing symptoms', async () => {
      const invalidPayload = {
        ...validSearchPayload,
        symptoms: ''
      };

      const response = await request(app)
        .post('/api/search/providers')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for symptoms that are too short', async () => {
      const invalidPayload = {
        ...validSearchPayload,
        symptoms: 'pain'
      };

      const response = await request(app)
        .post('/api/search/providers')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for symptoms that are too long', async () => {
      const invalidPayload = {
        ...validSearchPayload,
        symptoms: 'a'.repeat(501)
      };

      const response = await request(app)
        .post('/api/search/providers')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing location', async () => {
      const invalidPayload = {
        ...validSearchPayload,
        location: ''
      };

      const response = await request(app)
        .post('/api/search/providers')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid radius', async () => {
      const invalidPayload = {
        ...validSearchPayload,
        radius: 150
      };

      const response = await request(app)
        .post('/api/search/providers')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle GPT service failure gracefully', async () => {
      gptService.analyzeSymptoms.mockResolvedValue({
        success: false,
        error: 'API rate limit exceeded'
      });

      const response = await request(app)
        .post('/api/search/providers')
        .send(validSearchPayload)
        .expect(500);

      expect(response.body.error).toBe('Failed to analyze symptoms');
    });

    it('should handle NPI service failure gracefully', async () => {
      gptService.analyzeSymptoms.mockResolvedValue({
        success: true,
        urgency: 'medium',
        specialties: ['family medicine'],
        recommendations: ['Schedule appointment']
      });

      npiService.searchProviders.mockRejectedValue(new Error('NPI API error'));

      const response = await request(app)
        .post('/api/search/providers')
        .send(validSearchPayload)
        .expect(500);

      expect(response.body.error).toBe('Search failed');
    });

    it('should return cached results when available', async () => {
      const cachedResult = {
        analysis: {
          urgency: 'low',
          specialties: ['family medicine'],
          recommendations: ['Schedule routine appointment']
        },
        providers: [],
        searchParams: { location: 'Philadelphia, PA', radius: 25 }
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const response = await request(app)
        .post('/api/search/providers')
        .send(validSearchPayload)
        .expect(200);

      expect(response.body).toEqual(cachedResult);
      expect(gptService.analyzeSymptoms).not.toHaveBeenCalled();
      expect(npiService.searchProviders).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/search/specialties', () => {
    it('should return list of medical specialties', async () => {
      const response = await request(app)
        .get('/api/search/specialties')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('category');
    });

    it('should return cached specialties when available', async () => {
      const cachedSpecialties = [
        { name: 'cardiology', code: '207RC0000X', category: 'Cardiology' }
      ];

      cacheService.get.mockResolvedValue(cachedSpecialties);

      const response = await request(app)
        .get('/api/search/specialties')
        .expect(200);

      expect(response.body).toEqual(cachedSpecialties);
    });
  });

  describe('GET /api/search/provider/:npi', () => {
    it('should return provider details for valid NPI', async () => {
      const mockProvider = {
        npi: '1234567890',
        name: 'Dr. Jane Doe, MD',
        specialty: 'Internal Medicine',
        address: {
          street: '456 Oak Ave',
          city: 'Philadelphia',
          state: 'PA',
          zip: '19102',
          full: '456 Oak Ave, Philadelphia, PA 19102'
        },
        phone: '(555) 987-6543',
        rating: 4.9,
        acceptingNewPatients: true,
        education: 'Harvard Medical School',
        languages: ['English', 'Spanish'],
        insurance: ['Aetna', 'Blue Cross Blue Shield']
      };

      npiService.getProviderByNPI.mockResolvedValue(mockProvider);

      const response = await request(app)
        .get('/api/search/provider/1234567890')
        .expect(200);

      expect(response.body).toEqual(mockProvider);
    });

    it('should return 400 for invalid NPI format', async () => {
      const response = await request(app)
        .get('/api/search/provider/invalid-npi')
        .expect(400);

      expect(response.body.error).toBe('Invalid NPI');
    });

    it('should return 404 for non-existent provider', async () => {
      npiService.getProviderByNPI.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/search/provider/9999999999')
        .expect(404);

      expect(response.body.error).toBe('Provider not found');
    });

    it('should return cached provider when available', async () => {
      const cachedProvider = {
        npi: '1234567890',
        name: 'Dr. Cached Provider',
        specialty: 'Cardiology'
      };

      cacheService.get.mockResolvedValue(cachedProvider);

      const response = await request(app)
        .get('/api/search/provider/1234567890')
        .expect(200);

      expect(response.body).toEqual(cachedProvider);
      expect(npiService.getProviderByNPI).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/search/feedback', () => {
    const validFeedback = {
      searchId: 'search-123',
      rating: 5,
      comment: 'Great search results!'
    };

    it('should accept valid feedback', async () => {
      const response = await request(app)
        .post('/api/search/feedback')
        .send(validFeedback)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Thank you for your feedback!');
    });

    it('should return 400 for missing search ID', async () => {
      const invalidFeedback = {
        ...validFeedback,
        searchId: ''
      };

      const response = await request(app)
        .post('/api/search/feedback')
        .send(invalidFeedback)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid rating', async () => {
      const invalidFeedback = {
        ...validFeedback,
        rating: 6
      };

      const response = await request(app)
        .post('/api/search/feedback')
        .send(invalidFeedback)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for comment that is too long', async () => {
      const invalidFeedback = {
        ...validFeedback,
        comment: 'a'.repeat(1001)
      };

      const response = await request(app)
        .post('/api/search/feedback')
        .send(invalidFeedback)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error
      gptService.analyzeSymptoms.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/search/providers')
        .send({
          symptoms: 'test symptoms',
          location: 'Test City, ST'
        })
        .expect(500);

      expect(response.body.error).toBe('Search failed');
    });
  });
});

describe('Search Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate GPT and NPI services correctly', async () => {
    const symptoms = 'chest pain and difficulty breathing';
    
    // Mock GPT analysis
    gptService.analyzeSymptoms.mockResolvedValue({
      success: true,
      urgency: 'high',
      specialties: ['cardiology', 'emergency medicine'],
      recommendations: ['Seek immediate care']
    });

    // Mock provider search
    npiService.searchProviders.mockResolvedValue([
      { npi: '1111111111', name: 'Dr. Heart Specialist', specialty: 'Cardiology' },
      { npi: '2222222222', name: 'Dr. Emergency Doc', specialty: 'Emergency Medicine' }
    ]);

    const response = await request(app)
      .post('/api/search/providers')
      .send({
        symptoms,
        location: 'New York, NY',
        radius: 25
      })
      .expect(200);

    expect(gptService.analyzeSymptoms).toHaveBeenCalledWith(symptoms);
    expect(npiService.searchProviders).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'New York, NY',
        radius: 25,
        specialties: expect.arrayContaining(['cardiology', 'emergency medicine'])
      })
    );
    expect(response.body.providers).toHaveLength(2);
  });
});