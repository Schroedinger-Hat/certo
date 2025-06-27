/**
 * achievement controller
 */

import { factories } from '@strapi/strapi'

interface Achievement {
  id: any
  name: string
  description: string
  credentials?: any[]
  image?: any
  creator?: any
  tags?: any
}

export default factories.createCoreController('api::achievement.achievement', ({ strapi }) => ({
  // Custom controller method to handle creation with empty tags
  async create(ctx) {
    try {
      // Get the data from the request body
      const { data } = ctx.request.body;
      
      // Handle empty tags
      if (data.tags === '' || data.tags === undefined || data.tags === null) {
        data.tags = [];
      }
      
      // Bypass permission checks by using entityService directly
      const entity = await strapi.entityService.create('api::achievement.achievement', { 
        data 
      });
      
      // Return the created entity
      return { data: entity };
    } catch (error) {
      console.error('Error creating achievement:', error);
      return ctx.badRequest('Failed to create achievement', { error: error.message });
    }
  },
  
  // Custom method for public creation of achievements
  async createAchievement(ctx) {
    try {
      // Get the data from the request body
      const { data } = ctx.request.body;
      
      // Handle empty tags by ensuring it's a valid JSON array
      if (data.tags === '' || data.tags === undefined || data.tags === null) {
        data.tags = [];
      }
      
      // Create the achievement using the entity service directly
      const achievement = await strapi.entityService.create('api::achievement.achievement', {
        data
      });
      
      return { data: achievement };
    } catch (error) {
      console.error('Error in createAchievement:', error);
      return ctx.badRequest('Failed to create achievement', { error: error.toString() });
    }
  },
  
  // Custom method to find achievement with credentials
  async findWithCredentials(ctx) {
    try {
      const { id } = ctx.params
      
      const achievement = await strapi.entityService.findOne('api::achievement.achievement', id, {
        status: 'published',
        populate: ['credentials', 'credentials.recipient', 'image', 'creator']
      }) as Achievement
      
      if (!achievement) {
        return ctx.notFound('Achievement not found')
      }
      
      return { data: achievement }
    } catch (err) {
      ctx.badRequest('Error fetching achievement', { error: err })
    }
  }
})) 