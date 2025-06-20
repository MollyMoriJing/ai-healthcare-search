const request = require('supertest');
const app = require('../app');

describe('POST /api/search', () => {
  it('responds with specialty and providers', async () => {
    const res = await request(app).post('/api/search').send({ symptoms: 'headache and nausea' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('specialty');
    expect(res.body).toHaveProperty('providers');
  });
});