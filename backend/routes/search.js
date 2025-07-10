const express = require('express');
const { body, validationResult } = require('express-validator');
const gptService = require('../services/gptService');
const npiService = require('../services/npiService');
const cacheService = require('../services/cache');
const logger = require('../utils/logger');
const { specialtyMapping } = require('../utils/specialtyMap');

const router = express.Router();

// Validation middleware
const validateSearchRequest = [
  body('symptoms')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Symptoms must be between 3 and 500 characters'),
  body('location')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 miles'),
  body('insurance')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Insurance must be less than 50 characters')
];

// POST /api/search/providers
router.post('/providers', validateSearchRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { symptoms, location = '', radius = 25, insurance = '' } = req.body;
    
    // Create cache key
    const cacheKey = `search:${Buffer.from(JSON.stringify({ symptoms, location, radius, insurance })).toString('base64')}`;
    
    // Check cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      logger.info('Cache hit for search request');
      return res.json(cachedResult);
    }

    logger.info('Processing search request', { symptoms: symptoms.substring(0, 50) + '...', location, radius });

    // Step 1: Analyze symptoms with GPT
    const gptAnalysis = await gptService.analyzeSymptoms(symptoms);
    
    if (!gptAnalysis.success) {
      return res.status(500).json({
        error: 'Failed to analyze symptoms',
        message: 'Please try again with different symptoms'
      });
    }

    // Step 2: Get relevant specialties
    const specialties = gptAnalysis.specialties.map(specialty => 
      specialtyMapping[specialty.toLowerCase()] || specialty
    );

    // Step 3: Search for providers
    const searchParams = {
      location,
      radius,
      specialties,
      insurance,
      limit: 20
    };

    const providers = await npiService.searchProviders(searchParams);

    const result = {
      analysis: {
        urgency: gptAnalysis.urgency,
        specialties: gptAnalysis.specialties,
        recommendations: gptAnalysis.recommendations,
        disclaimer: "This is not medical advice. Please consult with healthcare professionals for proper diagnosis and treatment."
      },
      providers: providers.slice(0, 15), // Limit results
      searchParams: {
        location,
        radius,
        specialties,
        totalFound: providers.length
      },
      timestamp: new Date().toISOString()
    };

    // Cache the result
    await cacheService.set(cacheKey, result, 3600); // Cache for 1 hour

    res.json(result);

  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while processing your request'
    });
  }
});

// GET /api/search/specialties
router.get('/specialties', async (req, res) => {
  try {
    const cacheKey = 'specialties:list';
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const specialties = Object.keys(specialtyMapping).map(key => ({
      name: key,
      code: specialtyMapping[key],
      category: getSpecialtyCategory(key)
    }));

    await cacheService.set(cacheKey, specialties, 86400); // Cache for 24 hours
    
    res.json(specialties);
  } catch (error) {
    logger.error('Specialties fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch specialties',
      message: 'Could not retrieve specialty list'
    });
  }
});

// GET /api/search/provider/:npi
router.get('/provider/:npi', async (req, res) => {
  try {
    const { npi } = req.params;
    
    if (!/^\d{10}$/.test(npi)) {
      return res.status(400).json({
        error: 'Invalid NPI',
        message: 'NPI must be a 10-digit number'
      });
    }

    const cacheKey = `provider:${npi}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const provider = await npiService.getProviderByNPI(npi);
    
    if (!provider) {
      return res.status(404).json({
        error: 'Provider not found',
        message: 'No provider found with the given NPI'
      });
    }

    await cacheService.set(cacheKey, provider, 7200); // Cache for 2 hours
    
    res.json(provider);
  } catch (error) {
    logger.error('Provider fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch provider',
      message: 'Could not retrieve provider information'
    });
  }
});

// POST /api/search/feedback
router.post('/feedback', [
  body('searchId').isString().withMessage('Search ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { searchId, rating, comment } = req.body;
    
    // In a real app, this would save to database
    logger.info('Feedback received', { searchId, rating, comment });
    
    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    logger.error('Feedback error:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: 'Could not save your feedback'
    });
  }
});

// Helper function to categorize specialties
function getSpecialtyCategory(specialty) {
  const categories = {
    'Primary Care': ['family medicine', 'internal medicine', 'pediatrics', 'general practice'],
    'Cardiology': ['cardiology', 'cardiac surgery', 'vascular surgery'],
    'Neurology': ['neurology', 'neurosurgery', 'psychiatry'],
    'Orthopedics': ['orthopedic surgery', 'sports medicine', 'physical therapy'],
    'Dermatology': ['dermatology', 'plastic surgery'],
    'Emergency': ['emergency medicine', 'urgent care'],
    'Specialty': ['oncology', 'endocrinology', 'gastroenterology', 'pulmonology']
  };

  for (const [category, specialties] of Object.entries(categories)) {
    if (specialties.some(s => specialty.toLowerCase().includes(s))) {
      return category;
    }
  }
  
  return 'Other';
}

module.exports = router;