import type { Core } from '@strapi/strapi';
import { seedDevelopmentData } from './bootstrap/seed-data';
import { setupPermissions } from './bootstrap/permissions-setup';
import { warnIfDefaultAdminCredentials } from './bootstrap/default-credentials-warning';
import { registerMonitoringRoutes } from './monitoring/routes';

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
  register({ strapi }) {
    // Must happen here, not in bootstrap(): Strapi finalizes routing
    // (server.initRouting()) partway through its own bootstrap(), before
    // this app's bootstrap({ strapi }) hook runs - see monitoring/routes.ts.
    registerMonitoringRoutes(strapi);
  },

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

    // Warn on every boot if the default admin credentials are still active,
    // regardless of environment (see bootstrap/default-credentials-warning.ts)
    await warnIfDefaultAdminCredentials(strapi);

    // Schedule daily credential expiration scan.
    // Run once at startup (30s delay to let Strapi fully settle) and then every 24h.
    const runExpirationCheck = async () => {
      try {
        const scanner = strapi.service('api::credential.expiration-scanner');
        await scanner.runDailyCheck();
      } catch (err: any) {
        strapi.log.error('[bootstrap] Expiration scanner error:', { error: err.message });
      }
    };

    setTimeout(runExpirationCheck, 30_000);
    setInterval(runExpirationCheck, 24 * 60 * 60 * 1000);

    // Schedule daily check for pending scheduled issuances.
    // Runs on startup (30s delay) then every 24h — processes any issuances due today.
    const runScheduledIssuanceCheck = async () => {
      try {
        const scanner = strapi.service('api::scheduled-issuance.scheduled-issuance-scanner');
        await scanner.runDailyCheck();
      } catch (err: any) {
        strapi.log.error('[bootstrap] Scheduled issuance scanner error:', { error: err.message });
      }
    };

    setTimeout(runScheduledIssuanceCheck, 35_000);
    setInterval(runScheduledIssuanceCheck, 24 * 60 * 60 * 1000);
  },
};
