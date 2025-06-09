import type { Core } from '@strapi/strapi';

/**
 * Main entry point for the Strapi application
 */

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Set public permissions for custom routes
    const publicRole = await strapi
      .query("plugin::users-permissions.role")
      .findOne({ where: { type: "public" } });

    if (publicRole) {
      // Get all existing permissions
      const publicPermissions = await strapi
        .query("plugin::users-permissions.permission")
        .findMany({
          where: {
            role: publicRole.id,
          },
        });

      // Check for credential custom route permissions
      const credentialControllerPermissions = publicPermissions.filter(
        (permission) =>
          permission.controller === "credential" &&
          ["issue", "validate", "verify"].includes(permission.action)
      );

      // Create missing permissions
      const customActions = ["issue", "validate", "verify"];
      for (const action of customActions) {
        const exists = credentialControllerPermissions.some(
          (p) => p.action === action
        );

        if (!exists) {
          await strapi.query("plugin::users-permissions.permission").create({
            data: {
              action: action,
              controller: "credential",
              type: "api::credential.credential",
              role: publicRole.id,
              enabled: true,
            },
          });
          console.log(`Created public permission for credential.${action}`);
        }
      }
    }
  },
};

/**
 * Set up public permissions for content creation
 */
async function setupPublicPermissions(strapi) {
  try {
    strapi.log.info('Setting up permissions for public content creation...');
    
    // Get the public role
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      strapi.log.error('Public role not found');
      return;
    }

    // Define the permissions to enable
    const permissionsToEnable = [
      // Basic CRUD permissions
      { action: 'create', subject: 'api::achievement.achievement' },
      { action: 'update', subject: 'api::achievement.achievement' },
      { action: 'create', subject: 'api::credential.credential' },
      { action: 'update', subject: 'api::credential.credential' },
      
      // Custom endpoint permissions
      { action: 'api::credential.credential.issue', subject: null },
      { action: 'api::credential.credential.verify', subject: null },
      { action: 'api::credential.credential.revoke', subject: null }
    ];

    // Enable each permission
    for (const perm of permissionsToEnable) {
      try {
        // Find the permission
        const whereClause: Record<string, any> = {
          role: publicRole.id,
        };
        
        if (perm.subject) {
          whereClause.action = `${perm.subject}.${perm.action}`;
        } else {
          whereClause.action = perm.action;
        }
        
        const permission = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({ where: whereClause });

        if (permission) {
          // Enable the permission
          await strapi
            .query('plugin::users-permissions.permission')
            .update({
              where: { id: permission.id },
              data: { enabled: true },
            });
          
          strapi.log.info(`Enabled permission: ${permission.action}`);
        } else {
          strapi.log.warn(`Permission not found: ${perm.subject ? `${perm.subject}.${perm.action}` : perm.action}`);
        }
      } catch (error) {
        strapi.log.error(`Error setting permission ${perm.subject ? `${perm.subject}.${perm.action}` : perm.action}:`, error);
      }
    }

    strapi.log.info('Permission setup complete');
  } catch (error) {
    strapi.log.error('Error in setupPublicPermissions:', error);
  }
}
