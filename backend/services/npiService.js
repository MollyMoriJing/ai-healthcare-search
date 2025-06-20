const axios = require('axios');

async function findProviders(specialty) {
  const res = await axios.get(`https://npiregistry.cms.hhs.gov/api/?version=2.1&taxonomy_description=${specialty}&limit=5`);
  return res.data.results || [];
}

module.exports = { findProviders };