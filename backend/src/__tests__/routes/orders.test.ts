import request from 'supertest'
import express from 'express'
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { ordersRouter } from '../../routes/orders.js'
import { connectDatabase, disconnectDatabase } from '../../utils/database.js'

// Create a simpler test that doesn't require complex mocking
const app = express()
app.use(express.json())
app.use('/api/orders', ordersRouter)

describe('Orders API', () => {
  beforeAll(async () => {
    // Connect to test database or use in-memory
    try {
      await connectDatabase()
    } catch (error) {
      // Ignore connection errors in test environment
      console.warn('Database connection skipped in test environment')
    }
  })

  afterAll(async () => {
    try {
      await disconnectDatabase()
    } catch (error) {
      // Ignore disconnection errors
    }
  })

  describe('POST /api/orders', () => {
    it('should return 400 for invalid data', async () => {
      const invalidData = {
        companyName: 'A', // Too short
        email: 'invalid-email', // Invalid email
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('Validation failed')
    })

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        companyName: 'Test Company',
        // Missing other required fields
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 for empty items array', async () => {
      const invalidData = {
        companyName: 'Test Company',
        contactName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        items: [], // Empty items
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
