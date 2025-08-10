import type { Core } from '@strapi/strapi';

/**
 * Set up public permissions for content creation
 */
async function setupPermissions(strapi: any) {
  try {
    strapi.log.info('Setting up permissions for public content creation...');
    
    // Check if users-permissions plugin is ready
    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
    if (!pluginStore) {
      strapi.log.info('Users-permissions plugin not ready yet - skipping permissions setup');
      return;
    }
    
    // Get the public role
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      strapi.log.info('Public role not found - will setup on next restart after admin creation');
      return;
    }

    // Define permissions for public access
    const permissions = {
      'api::achievement.achievement': ['find', 'findOne'],
      'api::profile.profile': ['find', 'findOne'],
      'api::credential.credential': ['find', 'findOne', 'verify', 'validate'],
      'api::evidence.evidence': ['find', 'findOne'],
      'api::revocation-list.revocation-list': ['find']
    };

    // Get the current permissions for the public role
    const currentPermissions = await strapi
      .query('plugin::users-permissions.permission')
      .findMany({ where: { role: publicRole.id } });

    // Create a map of existing permissions
    const existingPermissions: any = {};
    currentPermissions.forEach((permission: any) => {
      const key = `${permission.action}`;
      existingPermissions[key] = permission;
    });

    // Update permissions
    for (const [controller, actions] of Object.entries(permissions)) {
      for (const action of actions) {
        const permissionAction = `api::${controller.split('::')[1]}.${controller.split('::')[2]}.${action}`;
        
        if (!existingPermissions[permissionAction]) {
          // Create permission if it doesn't exist
          await strapi.query('plugin::users-permissions.permission').create({
            data: {
              action: permissionAction,
              role: publicRole.id,
              enabled: true
            }
          });
          strapi.log.info(`Created permission: ${permissionAction}`);
        } else if (!existingPermissions[permissionAction].enabled) {
          // Enable permission if it exists but is disabled
          await strapi.query('plugin::users-permissions.permission').update({
            where: { id: existingPermissions[permissionAction].id },
            data: { enabled: true }
          });
          strapi.log.info(`Enabled permission: ${permissionAction}`);
        }
      }
    }

    strapi.log.info('Public permissions setup complete');
  } catch (error) {
    strapi.log.error('Error in setupPermissions:', error);
  }
}

/**
 * Sample data setup for development environment
 */
async function setupSampleData(strapi: any) {
  try {
    // Check if sample data already exists
    const existingProfile = await strapi.query('api::profile.profile').findOne({
      where: { email: 'john.doe@example.com' }
    });

    if (existingProfile) {
      strapi.log.info('Sample data already exists, skipping setup');
      return;
    }

    strapi.log.info('🎯 Setting up sample data for development...');

    // Create sample profiles
    const sampleProfiles = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'Software Developer and Open Source Enthusiast',
        website: 'https://johndoe.dev',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe'
      },
      {
        name: 'Jane Smith', 
        email: 'jane.smith@example.com',
        bio: 'UX Designer and Digital Accessibility Advocate',
        website: 'https://janesmith.design',
        linkedin: 'https://linkedin.com/in/janesmith'
      }
    ];

    for (const profileData of sampleProfiles) {
      await strapi.query('api::profile.profile').create({
        data: profileData
      });
      strapi.log.info(`✅ Created sample profile: ${profileData.name}`);
    }

    // Create sample achievements
    const sampleAchievements = [
      {
        name: 'Open Source Contributor',
        description: 'Contributed to open source projects and helped build the developer community',
        criteria: 'Made meaningful contributions to open source repositories'
      },
      {
        name: 'Workshop Completion',
        description: 'Successfully completed a technical workshop',
        criteria: 'Attended and participated in all workshop sessions'
      }
    ];

    for (const achievementData of sampleAchievements) {
      await strapi.query('api::achievement.achievement').create({
        data: achievementData
      });
      strapi.log.info(`✅ Created sample achievement: ${achievementData.name}`);
    }

    strapi.log.info('✅ Sample data setup complete!');
  } catch (error) {
    strapi.log.error('Error setting up sample data:', error);
  }
}

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
    // Run permissions setup (gracefully handle if not ready)
    try {
      await setupPermissions(strapi);
    } catch (error) {
      strapi.log.info('Permissions setup will be available after admin user creation');
    }
    
    // Run sample data setup if in development
    if (process.env.NODE_ENV === 'development') {
      await setupSampleData(strapi);
    }

    // Set public permissions for custom credential routes (gracefully handle if not ready)
    try {
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
            strapi.log.info(`Created public permission for credential.${action}`);
          }
        }
      }
    } catch (error) {
      strapi.log.info('Custom route permissions will be setup after admin user creation');
    }
  },
};
