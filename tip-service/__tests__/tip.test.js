const request = require('supertest');
const app = require('../server');

// Mock the pg library itself to prevent any DB connection
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

// We still mock nodemailer
jest.mock('nodemailer');

describe('API Tip Endpoints', () => {
  it('should return 404 for a non-existent route', async () => {
    const response = await request(app).get('/a-route-that-does-not-exist');
    expect(response.statusCode).toBe(404);
  });
});