/**
 * Permissions setup script for Strapi bootstrap
 * 
 * This script sets up default permissions for public access to content types
 * It should be called during bootstrap to ensure consistent permissions
 */

async function setupPermissions(strapi) {
  // Get the public role
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.error('Public role not found');
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
  const existingPermissions = {};
  currentPermissions.forEach(permission => {
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
}

module.exports = setupPermissions; 