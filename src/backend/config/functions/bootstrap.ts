/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

interface Action {
  section: string;
  displayName: string;
  uid: string;
  pluginName: string | null;
  subCategory: string;
  subjects: string[];
}

interface Permission {
  id: number;
  action: string;
  role: number;
  enabled: boolean;
}

interface Role {
  id: number;
  type: string;
}

export default async ({ strapi }): Promise<void> => {
  // Set public permissions for custom credential routes
  const actions: Action[] = [
    {
      section: 'content-manager',
      displayName: 'Access the Credential Content Manager',
      uid: 'content-manager.explorer.read',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'settings',
      displayName: 'Edit Credential Content Manager layouts',
      uid: 'content-manager.single-types.configure-view',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'content-manager',
      displayName: 'Edit Credential Content Manager layouts',
      uid: 'content-manager.collection-types.configure-view',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'content-manager',
      displayName: 'Create Credential entries',
      uid: 'content-manager.explorer.create',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'content-manager',
      displayName: 'Update Credential entries',
      uid: 'content-manager.explorer.update',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'content-manager',
      displayName: 'Delete Credential entries',
      uid: 'content-manager.explorer.delete',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'content-manager',
      displayName: 'Publish Credential entries',
      uid: 'content-manager.explorer.publish',
      pluginName: 'content-manager',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'content-type-builder',
      displayName: 'Read Credential Content Types',
      uid: 'content-type-builder.read',
      pluginName: 'content-type-builder',
      subCategory: 'contentTypes',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'settings',
      displayName: 'Access the Credential API documentation',
      uid: 'documentation.read',
      pluginName: 'documentation',
      subCategory: 'general',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'settings',
      displayName: 'Generate Credential API documentation',
      uid: 'documentation.settings.regenerate',
      pluginName: 'documentation',
      subCategory: 'general',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'plugins',
      displayName: 'Access the Credential API Documentation plugin',
      uid: 'documentation.settings.read',
      pluginName: 'documentation',
      subCategory: 'general',
      subjects: ['api::credential.credential'],
    },
    {
      section: 'settings',
      displayName: 'Update and delete Credential API documentation',
      uid: 'documentation.settings.update',
      pluginName: 'documentation',
      subCategory: 'general',
      subjects: ['api::credential.credential'],
    },
  ];

  // Custom controller actions for credential routes
  const customActions: Action[] = [
    {
      section: 'custom',
      displayName: 'Issue Badge',
      uid: 'api::credential.credential.issue',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    {
      section: 'custom',
      displayName: 'Verify Badge',
      uid: 'api::credential.credential.verify',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    {
      section: 'custom',
      displayName: 'Validate Badge',
      uid: 'api::credential.credential.validate',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
  ];

  // Add API actions
  const apiActions: Action[] = [
    {
      section: 'api',
      displayName: 'Find Credentials',
      uid: 'api::credential.credential.find',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Find One Credential',
      uid: 'api::credential.credential.findOne',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Create Credential',
      uid: 'api::credential.credential.create',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Update Credential',
      uid: 'api::credential.credential.update',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Delete Credential',
      uid: 'api::credential.credential.delete',
      pluginName: null,
      subCategory: 'credentials',
      subjects: [],
    },
    // Achievement API actions
    {
      section: 'api',
      displayName: 'Find Achievements',
      uid: 'api::achievement.achievement.find',
      pluginName: null,
      subCategory: 'achievements',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Find One Achievement',
      uid: 'api::achievement.achievement.findOne',
      pluginName: null,
      subCategory: 'achievements',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Create Achievement',
      uid: 'api::achievement.achievement.create',
      pluginName: null,
      subCategory: 'achievements',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Update Achievement',
      uid: 'api::achievement.achievement.update',
      pluginName: null,
      subCategory: 'achievements',
      subjects: [],
    },
    {
      section: 'api',
      displayName: 'Delete Achievement',
      uid: 'api::achievement.achievement.delete',
      pluginName: null,
      subCategory: 'achievements',
      subjects: [],
    },
  ];

  const allActions = [...actions, ...customActions, ...apiActions];

  // Find the public role
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } }) as Role;

  if (publicRole) {
    // Get all permissions for the public role
    const publicPermissions = await strapi
      .query('plugin::users-permissions.permission')
      .findMany({ where: { role: publicRole.id } }) as Permission[];

    // Create a map of existing permissions
    const existingPermissionsMap = publicPermissions.reduce((acc, permission) => {
      acc[permission.action] = permission;
      return acc;
    }, {} as Record<string, Permission>);

    // Create missing permissions
    for (const action of allActions) {
      const actionId = action.uid;
      
      if (!existingPermissionsMap[actionId]) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: actionId,
            role: publicRole.id,
            enabled: true,
          },
        });
        console.log(`Created public permission for ${actionId}`);
      }
    }
  }
}; 