import type { Core } from '@strapi/strapi';
import { seedDevelopmentData } from './bootstrap/seed-data';
import { setupPermissions } from './bootstrap/permissions-setup';

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
    // Seed development data (only creates data if it doesn't exist)
    await seedDevelopmentData(strapi);

    // Setup all permissions (public, authenticated roles)
    await setupPermissions(strapi);
  },
};
