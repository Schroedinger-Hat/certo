/**
 * achievement controller
 */

import { factories } from '@strapi/strapi'
import { achievementsCreatedTotal } from '../../../monitoring/metrics'

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
      
      // Use the core controller's create which enforces Strapi RBAC
      const response = await super.create(ctx);
      const entity = response.data ?? response;

      const auditLog = strapi.service('api::audit-log-entry.audit-log')
      await auditLog.record({
        action: 'achievement.create',
        entityType: 'achievement',
        entityId: entity.id,
        actorId: ctx.state.user?.id,
        metadata: { name: entity.name },
      })
      achievementsCreatedTotal.inc()

      // Return the created entity
      return response;
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
      
      // Use the core controller's create which enforces Strapi RBAC
      const response = await super.create(ctx);
      const achievement = response.data ?? response;

      const auditLog = strapi.service('api::audit-log-entry.audit-log')
      await auditLog.record({
        action: 'achievement.create',
        entityType: 'achievement',
        entityId: achievement.id,
        actorId: ctx.state.user?.id,
        metadata: { name: achievement.name },
      })
      achievementsCreatedTotal.inc()
      
      return response;
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
  },
  
  // Custom method to find achievements by creator id
  async findByCreator(ctx) {
    try {
      const { creatorId } = ctx.params
      if (!creatorId) {
        return ctx.badRequest('Missing creatorId parameter')
      }
      const achievements = await strapi.entityService.findMany('api::achievement.achievement', {
        status: 'published',
        filters: { creator: { id: creatorId } },
        populate: '*',
      })
      return { data: achievements }
    } catch (err) {
      ctx.badRequest('Error fetching achievements by creator', { error: err })
    }
  }
})) 