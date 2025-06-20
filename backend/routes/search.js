const express = require('express');
const router = express.Router();
const { interpretSymptoms } = require('../services/gptService');
const { findProviders } = require('../services/npiService');
const cache = require('../services/cache');

router.post('/', async (req, res) => {
  const { symptoms } = req.body;

  if (cache[symptoms]) {
    return res.json(cache[symptoms]);
  }

  try {
    const specialty = await interpretSymptoms(symptoms);
    const providers = await findProviders(specialty);
    const result = { specialty, providers };
    cache[symptoms] = result;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;