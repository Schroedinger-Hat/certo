/**
 * achievement service
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreService('api::achievement.achievement', ({ strapi }) => ({
  // Override default methods
  async create(params) {
    // Ensure tags is a valid JSON array
    const { data } = params;
    
    // Handle empty tags by setting it to an empty array
    if (data.tags === '' || data.tags === undefined || data.tags === null) {
      data.tags = [];
    }
    
    try {
      // Call the parent implementation
      const result = await super.create(params);
      return result;
    } catch (error) {
      console.error('Error in achievement create:', error);
      throw error;
    }
  },
  
  async update(entityId, params) {
    // Ensure tags is a valid JSON array
    const { data } = params;
    
    // Handle empty tags by setting it to an empty array
    if (data.tags === '' || data.tags === undefined || data.tags === null) {
      data.tags = [];
    }
    
    try {
      // Call the parent implementation
      const result = await super.update(entityId, params);
      return result;
    } catch (error) {
      console.error('Error in achievement update:', error);
      throw error;
    }
  }
})) 