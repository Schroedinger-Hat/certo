/**
 * Bootstrap module to run when the application starts
 */

export default async ({ strapi }) => {
  // Setup public permissions
  await setupPublicPermissions(strapi);
  
  // Setup authenticated permissions
  await setupAuthenticatedPermissions(strapi);
  
  // Force enable critical endpoints
  await forceEnableEndpoints(strapi);
  
  // Enable all authenticated permissions
  await enableAllAuthenticatedPermissions(strapi);
};

/**
 * Set up public permissions for required content types
 */
async function setupPublicPermissions(strapi) {
  strapi.log.info('Setting up public permissions...');
  
  // Get the public role
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.error('Public role not found');
    return;
  }

  // List of permissions to enable for public access
  const permissionsToEnable = [
    // Read permissions
    { action: 'find', subject: 'api::achievement.achievement' },
    { action: 'findOne', subject: 'api::achievement.achievement' },
    { action: 'find', subject: 'api::profile.profile' },
    { action: 'findOne', subject: 'api::profile.profile' },
    { action: 'find', subject: 'api::credential.credential' },
    { action: 'findOne', subject: 'api::credential.credential' },
    { action: 'find', subject: 'api::evidence.evidence' },
    { action: 'findOne', subject: 'api::evidence.evidence' },
    
    // Write permissions
    { action: 'create', subject: 'api::achievement.achievement' },
    { action: 'update', subject: 'api::achievement.achievement' },
    { action: 'create', subject: 'api::profile.profile' },
    { action: 'update', subject: 'api::profile.profile' },
    { action: 'create', subject: 'api::credential.credential' },
    { action: 'update', subject: 'api::credential.credential' },
  ];

  // Enable each permission
  for (const permission of permissionsToEnable) {
    try {
      // Find the permission in the database
      const permissionRecord = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            action: permission.action,
            subject: permission.subject,
            role: publicRole.id,
          },
        });

      if (permissionRecord) {
        // Update the permission to enable it
        await strapi
          .query('plugin::users-permissions.permission')
          .update({
            where: { id: permissionRecord.id },
            data: { enabled: true },
          });
        
        strapi.log.info(`Enabled permission: ${permission.subject}.${permission.action}`);
      } else {
        strapi.log.warn(`Permission not found: ${permission.subject}.${permission.action}`);
      }
    } catch (error) {
      strapi.log.error(`Error setting permission ${permission.subject}.${permission.action}:`, error);
    }
  }

  strapi.log.info('Public permissions setup complete');
}

/**
 * Set up authenticated user permissions
 */
async function setupAuthenticatedPermissions(strapi) {
  strapi.log.info('Setting up authenticated permissions...');
  
  // Get the authenticated role
  const authenticatedRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  if (!authenticatedRole) {
    strapi.log.error('Authenticated role not found');
    return;
  }

  // List of permissions to enable for authenticated users
  const permissionsToEnable = [
    // Read permissions
    { action: 'find', subject: 'api::achievement.achievement' },
    { action: 'findOne', subject: 'api::achievement.achievement' },
    { action: 'find', subject: 'api::profile.profile' },
    { action: 'findOne', subject: 'api::profile.profile' },
    { action: 'find', subject: 'api::credential.credential' },
    { action: 'findOne', subject: 'api::credential.credential' },
    { action: 'find', subject: 'api::evidence.evidence' },
    { action: 'findOne', subject: 'api::evidence.evidence' },
    
    // Custom controller actions
    { action: 'me', subject: 'api::profile.profile' },
    { action: 'myIssuedCredentials', subject: 'api::profile.profile' },
    { action: 'myReceivedCredentials', subject: 'api::profile.profile' },
    
    // Write permissions for credentials
    { action: 'create', subject: 'api::credential.credential' },
    { action: 'update', subject: 'api::credential.credential' },
    { action: 'delete', subject: 'api::credential.credential' },
    { action: 'issue', subject: 'api::credential.credential' },
    { action: 'validate', subject: 'api::credential.credential' },
    { action: 'verify', subject: 'api::credential.credential' },
    { action: 'import', subject: 'api::credential.credential' },
    { action: 'export', subject: 'api::credential.credential' },
    { action: 'revoke', subject: 'api::credential.credential' },
  ];

  // Force enable ALL permissions for authenticated users for api::credential.credential
  const allCredentialPermissions = await strapi
    .query('plugin::users-permissions.permission')
    .findMany({
      where: {
        subject: 'api::credential.credential',
        role: authenticatedRole.id,
      },
    });

  // Enable all credential permissions found
  for (const permission of allCredentialPermissions) {
    await strapi
      .query('plugin::users-permissions.permission')
      .update({
        where: { id: permission.id },
        data: { enabled: true },
      });
    
    strapi.log.info(`Enabled credential permission: ${permission.action}`);
  }

  // Enable each specific permission in our list
  for (const permission of permissionsToEnable) {
    try {
      // Find the permission in the database
      const permissionRecord = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            action: permission.action,
            subject: permission.subject,
            role: authenticatedRole.id,
          },
        });

      if (permissionRecord) {
        // Update the permission to enable it
        await strapi
          .query('plugin::users-permissions.permission')
          .update({
            where: { id: permissionRecord.id },
            data: { enabled: true },
          });
        
        strapi.log.info(`Enabled authenticated permission: ${permission.subject}.${permission.action}`);
      } else {
        strapi.log.warn(`Authenticated permission not found: ${permission.subject}.${permission.action}`);
      }
    } catch (error) {
      strapi.log.error(`Error setting authenticated permission ${permission.subject}.${permission.action}:`, error);
    }
  }

  strapi.log.info('Authenticated permissions setup complete');
}

/**
 * Force enable specific endpoints for authenticated users
 */
async function forceEnableEndpoints(strapi) {
  strapi.log.info('Force enabling critical endpoints...');
  
  // Get the authenticated role
  const authenticatedRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });
    
  if (!authenticatedRole) {
    strapi.log.error('Authenticated role not found');
    return;
  }
  
  // Get all permissions for authenticated role
  const allPermissions = await strapi
    .query('plugin::users-permissions.permission')
    .findMany({
      where: {
        role: authenticatedRole.id,
      },
    });
    
  // Critical controllers and their actions that must be enabled
  const criticalEndpoints = [
    // Credential endpoints
    { controller: 'credential', action: 'find' },
    { controller: 'credential', action: 'findOne' },
    { controller: 'credential', action: 'create' },
    { controller: 'credential', action: 'update' },
    { controller: 'credential', action: 'delete' },
    
    // Profile endpoints
    { controller: 'profile', action: 'find' },
    { controller: 'profile', action: 'findOne' },
    { controller: 'profile', action: 'me' },
    { controller: 'profile', action: 'myIssuedCredentials' },
    { controller: 'profile', action: 'myReceivedCredentials' },
    
    // Achievement endpoints
    { controller: 'achievement', action: 'find' },
    { controller: 'achievement', action: 'findOne' },
  ];
  
  // Enable critical endpoints
  for (const endpoint of criticalEndpoints) {
    // Find permission for this endpoint
    const permission = allPermissions.find(p => 
      p.action === endpoint.action && 
      p.subject?.includes(endpoint.controller)
    );
    
    if (permission) {
      // Enable the permission
      await strapi
        .query('plugin::users-permissions.permission')
        .update({
          where: { id: permission.id },
          data: { enabled: true },
        });
        
      strapi.log.info(`Force enabled: ${permission.subject}.${permission.action}`);
    } else {
      strapi.log.warn(`Could not find permission for ${endpoint.controller}.${endpoint.action}`);
    }
  }
  
  strapi.log.info('Critical endpoints enabled');
}

/**
 * Enable ALL permissions for authenticated users
 * This is a more aggressive approach but ensures everything works
 */
async function enableAllAuthenticatedPermissions(strapi) {
  strapi.log.info('Enabling ALL permissions for authenticated users...');
  
  // Get the authenticated role
  const authenticatedRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });
    
  if (!authenticatedRole) {
    strapi.log.error('Authenticated role not found');
    return;
  }
  
  // Get all permissions for authenticated role
  const allPermissions = await strapi
    .query('plugin::users-permissions.permission')
    .findMany({
      where: {
        role: authenticatedRole.id,
      },
    });
    
  // Enable all permissions for authenticated users
  for (const permission of allPermissions) {
    await strapi
      .query('plugin::users-permissions.permission')
      .update({
        where: { id: permission.id },
        data: { enabled: true },
      });
  }
  
  strapi.log.info(`Enabled ${allPermissions.length} permissions for authenticated users`);
} 