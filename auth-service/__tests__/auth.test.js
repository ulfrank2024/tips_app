const request = require('supertest');
const app = require('../server');

// Mock dependencies
jest.mock('../models/authModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Import the dependencies (the mocks will be used automatically)
const { AuthModel } = require('../models/authModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('API Auth Endpoints', () => {

  // Test for a non-existent route (already created)
  it('should return 404 for a non-existent route', async () => {
    const response = await request(app).get('/a-route-that-does-not-exist');
    expect(response.statusCode).toBe(404);
  });

  // Test suite for the LOGIN endpoint
  describe('POST /api/auth/login', () => {

    it('should login successfully with correct credentials', async () => {
      // Arrange: Mock a user and the password check
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        email_validated: true,
        role: 'manager',
        company_id: 123
      };
      AuthModel.findUserByEmail.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Assert: Check the response
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body.message).toBe('Connexion réussie.');
    });

    it('should fail with wrong password', async () => {
      // Arrange: Mock a user but a failed password check
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        email_validated: true
      };
      AuthModel.findUserByEmail.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false); // Simulate wrong password

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      // Assert: Check the response
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should fail if user does not exist', async () => {
      // Arrange: Mock that no user is found
      AuthModel.findUserByEmail.mockResolvedValue(null);

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'password123' });

      // Assert: Check the response
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should fail if email is not validated', async () => {
      // Arrange: Mock a user whose email is not validated
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        email_validated: false // Email not validated
      };
      AuthModel.findUserByEmail.mockResolvedValue(fakeUser);

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Assert: Check the response
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('EMAIL_NOT_VALIDATED');
    });

  });

});