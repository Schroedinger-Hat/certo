/**
 * Warns loudly, on every boot and regardless of NODE_ENV, if the seeded
 * default admin account is still using its seeded password.
 *
 * seedDevelopmentData() only skips seeding when NODE_ENV is explicitly
 * 'production' - a self-hoster who deploys via Docker without setting that
 * env var still gets admin@certo.com/certo seeded, and those credentials are
 * published in this project's own README. This check catches that case (and
 * the case of someone knowingly leaving them unchanged) after the fact,
 * instead of relying on every operator remembering to change them.
 */
import { DEFAULT_SEED_CONFIG } from './seed-data';

export async function warnIfDefaultAdminCredentials(strapi: any): Promise<void> {
  try {
    const adminUser = await strapi.db.query('admin::user').findOne({
      where: { email: DEFAULT_SEED_CONFIG.adminEmail },
    });

    if (!adminUser) return;

    const authService = strapi.service('admin::auth');
    const stillDefault = await authService.validatePassword(
      DEFAULT_SEED_CONFIG.adminPassword,
      adminUser.password,
    );

    if (!stillDefault) return;

    strapi.log.warn('='.repeat(60));
    strapi.log.warn(`[Security] The admin account "${DEFAULT_SEED_CONFIG.adminEmail}" still has its default seeded password.`);
    strapi.log.warn('[Security] These credentials are published in the public Certo README - change this password immediately if this instance is reachable by anyone other than you.');
    strapi.log.warn('='.repeat(60));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    strapi.log.error(`[Security] Could not check default admin credentials: ${message}`);
  }
}
