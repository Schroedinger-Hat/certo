/**
 * Permission setup for Strapi v5
 * Creates and enables permissions for authenticated users
 */

// Permissions to enable for authenticated users
const AUTHENTICATED_PERMISSIONS = [
  // Profile permissions
  'api::profile.profile.find',
  'api::profile.profile.findOne',
  'api::profile.profile.create',
  'api::profile.profile.update',
  'api::profile.profile.delete',
  'api::profile.profile.me',
  'api::profile.profile.myIssuedCredentials',
  'api::profile.profile.myReceivedCredentials',
  'api::profile.profile.findIssuedCredentials',
  'api::profile.profile.findReceivedCredentials',
  
  // Achievement permissions
  'api::achievement.achievement.find',
  'api::achievement.achievement.findOne',
  'api::achievement.achievement.create',
  'api::achievement.achievement.update',
  'api::achievement.achievement.delete',
  'api::achievement.achievement.credentials',
  
  // Credential permissions
  'api::credential.credential.find',
  'api::credential.credential.findOne',
  'api::credential.credential.create',
  'api::credential.credential.update',
  'api::credential.credential.delete',
  'api::credential.credential.issue',
  'api::credential.credential.verify',
  'api::credential.credential.validate',
  'api::credential.credential.revoke',
  'api::credential.credential.import',
  'api::credential.credential.export',
  'api::credential.credential.certificate',
  
  // Evidence permissions
  'api::evidence.evidence.find',
  'api::evidence.evidence.findOne',
  'api::evidence.evidence.create',
  'api::evidence.evidence.update',
  'api::evidence.evidence.delete',
  
  // Endorsement permissions
  'api::endorsement.endorsement.find',
  'api::endorsement.endorsement.findOne',
  'api::endorsement.endorsement.create',
  'api::endorsement.endorsement.update',
  'api::endorsement.endorsement.delete',
  'api::endorsement.endorsement.verify',
];

// Permissions to enable for public users
const PUBLIC_PERMISSIONS = [
  // Profile - read only
  'api::profile.profile.find',
  'api::profile.profile.findOne',
  'api::profile.profile.findIssuedCredentials',
  'api::profile.profile.findReceivedCredentials',
  
  // Achievement - read only
  'api::achievement.achievement.find',
  'api::achievement.achievement.findOne',
  'api::achievement.achievement.credentials',
  
  // Credential - read and verify
  'api::credential.credential.find',
  'api::credential.credential.findOne',
  'api::credential.credential.verify',
  'api::credential.credential.validate',
  'api::credential.credential.certificate',
  
  // Evidence - read only
  'api::evidence.evidence.find',
  'api::evidence.evidence.findOne',
  
  // Endorsement - read and verify
  'api::endorsement.endorsement.find',
  'api::endorsement.endorsement.findOne',
  'api::endorsement.endorsement.verify',
];

/**
 * Setup permissions for a specific role
 */
async function setupRolePermissions(strapi: any, roleType: string, permissions: string[]): Promise<void> {
  strapi.log.info(`[Permissions] Setting up ${roleType} permissions...`);
  
  // Get the role
  const role = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: roleType } });

  if (!role) {
    strapi.log.error(`[Permissions] ${roleType} role not found`);
    return;
  }

  let created = 0;
  let linked = 0;

  for (const action of permissions) {
    try {
      // Check if permission exists
      let permission = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action } });

      // Create permission if it doesn't exist
      if (!permission) {
        permission = await strapi
          .query('plugin::users-permissions.permission')
          .create({ data: { action } });
        created++;
      }

      // Check if permission is already linked to role
      const existingLink = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { 
          action,
        },
        populate: ['role'],
      });

      // Link permission to role if not already linked
      const isLinked = existingLink?.role?.id === role.id;
      
      if (!isLinked) {
        // Use raw query to create the link
        await strapi.db.connection.raw(`
          INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord)
          VALUES (?, ?, 1)
          ON CONFLICT DO NOTHING
        `, [permission.id, role.id]);
        linked++;
      }
    } catch (error) {
      // Ignore duplicate key errors
      if (!String(error).includes('duplicate key')) {
        strapi.log.warn(`[Permissions] Could not set ${action}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  strapi.log.info(`[Permissions] ${roleType}: created ${created} permissions, linked ${linked} to role`);
}

/**
 * Main permission setup function
 */
export async function setupPermissions(strapi: any): Promise<void> {
  strapi.log.info('[Permissions] Starting permission setup...');
  
  try {
    // Setup authenticated permissions
    await setupRolePermissions(strapi, 'authenticated', AUTHENTICATED_PERMISSIONS);
    
    // Setup public permissions
    await setupRolePermissions(strapi, 'public', PUBLIC_PERMISSIONS);
    
    strapi.log.info('[Permissions] Permission setup complete');
  } catch (error) {
    strapi.log.error('[Permissions] Error setting up permissions:', error instanceof Error ? error.message : error);
  }
}

export default setupPermissions;
