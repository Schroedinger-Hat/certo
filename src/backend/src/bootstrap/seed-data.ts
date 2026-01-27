/**
 * Seed data for local development
 * Creates sample user, profile, achievement, and credential
 * 
 * This script only runs if the seed data doesn't already exist
 */

import { randomUUID } from 'crypto';

interface SeedConfig {
  adminEmail: string;
  adminPassword: string;
  adminUsername: string;
  adminFirstName: string;
  adminLastName: string;
}

const DEFAULT_SEED_CONFIG: SeedConfig = {
  adminEmail: 'admin@certo.com',
  adminPassword: 'certo',
  adminUsername: 'admin',
  adminFirstName: 'Certo',
  adminLastName: 'Admin',
};

/**
 * Seeds the database with sample data for local development
 * Only runs if the admin user doesn't already exist
 */
export async function seedDevelopmentData(strapi: any): Promise<void> {
  // Only seed in development environment
  if (process.env.NODE_ENV === 'production') {
    strapi.log.info('[Seed] Skipping seed data in production environment');
    return;
  }

  try {
    // Check if Strapi admin user already exists
    const existingStrapiAdmin = await strapi.db.query('admin::user').findOne({
      where: { email: DEFAULT_SEED_CONFIG.adminEmail },
    });

    if (existingStrapiAdmin) {
      strapi.log.info('[Seed] Seed data already exists, skipping...');
      return;
    }

    strapi.log.info('[Seed] Creating seed data for local development...');

    // 1. Create Strapi Admin user (for /admin panel access)
    const superAdminRole = await strapi.db.query('admin::role').findOne({
      where: { code: 'strapi-super-admin' },
    });

    if (!superAdminRole) {
      strapi.log.error('[Seed] Super Admin role not found, cannot create admin user');
      return;
    }

    const hashedPassword = await strapi.service('admin::auth').hashPassword(DEFAULT_SEED_CONFIG.adminPassword);

    const strapiAdminUser = await strapi.db.query('admin::user').create({
      data: {
        firstname: DEFAULT_SEED_CONFIG.adminFirstName,
        lastname: DEFAULT_SEED_CONFIG.adminLastName,
        email: DEFAULT_SEED_CONFIG.adminEmail,
        password: hashedPassword,
        isActive: true,
        blocked: false,
        roles: [superAdminRole.id],
      },
    });

    // 2. Create users-permissions user (for frontend/API authentication)
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      strapi.log.error('[Seed] Authenticated role not found, cannot seed API user');
      return;
    }

    const userService = strapi.plugin('users-permissions').service('user');
    const apiUser = await userService.add({
      username: DEFAULT_SEED_CONFIG.adminUsername,
      email: DEFAULT_SEED_CONFIG.adminEmail,
      password: DEFAULT_SEED_CONFIG.adminPassword,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: authenticatedRole.id,
    });

    // 3. Create a profile for the admin user (as an Issuer)
    const adminProfile = await strapi.entityService.create('api::profile.profile', {
      data: {
        name: 'Certo Admin',
        email: DEFAULT_SEED_CONFIG.adminEmail,
        description: 'Default administrator and issuer for Certo platform. This profile is used for testing and development purposes.',
        profileType: 'Both',
        url: 'https://certo.dev',
        publishedAt: new Date(),
      },
    });

    // 4. Create a sample achievement
    const sampleAchievement = await strapi.entityService.create('api::achievement.achievement', {
      data: {
        name: 'Welcome to Certo',
        description: 'This badge is awarded to users who have successfully set up and explored the Certo platform. It demonstrates familiarity with the Open Badges 3.0 standard and the Certo credential management system.',
        achievementType: 'Achievement',
        achievementId: 'welcome-to-certo',
        tags: ['onboarding', 'welcome', 'getting-started'],
        criteria: {
          narrative: 'To earn this badge, you must:\n\n1. Set up a local development environment with Docker\n2. Create a user account\n3. Explore the credential management interface\n4. Understand the basics of Open Badges 3.0',
        },
        skills: [
          { skillName: 'Docker Basics', skillDescription: 'Understanding of containerized development environments' },
          { skillName: 'Open Badges 3.0', skillDescription: 'Familiarity with the Open Badges 3.0 specification' },
        ],
        creator: adminProfile.id,
        publishedAt: new Date(),
      },
    });

    // 5. Create a sample credential (badge award) granted to the admin user
    const credentialId = `urn:uuid:${randomUUID()}`;
    const baseUrl = strapi.config.get('server.url', 'http://localhost:1337');
    
    // Generate cryptographic proof for the credential
    let proof;
    try {
      const pkcs8 = process.env.ED25519_PRIVATE_KEY_PKCS8;
      if (pkcs8) {
        const { importPKCS8, SignJWT } = await import('jose');
        const credentialPayload = {
          credentialId,
          name: sampleAchievement.name,
          description: sampleAchievement.description,
          type: ['VerifiableCredential', 'OpenBadgeCredential'],
          achievement: sampleAchievement.id,
          issuer: adminProfile.id,
          recipient: adminProfile.id,
          issuanceDate: new Date().toISOString(),
        };
        const privateKey = await importPKCS8(Buffer.from(pkcs8, 'base64').toString('utf8'), 'EdDSA');
        const jws = await new SignJWT(credentialPayload)
          .setProtectedHeader({ alg: 'EdDSA' })
          .sign(privateKey);
        proof = {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          verificationMethod: `${baseUrl}/api/profiles/${adminProfile.id}/keys`,
          proofPurpose: 'assertionMethod',
          jws
        };
      }
    } catch (proofError) {
      strapi.log.warn('[Seed] Could not generate cryptographic proof, using placeholder:', proofError);
      proof = {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${baseUrl}/api/profiles/${adminProfile.id}/keys`,
        proofPurpose: 'assertionMethod',
        proofValue: 'z' + randomUUID().replace(/-/g, '')
      };
    }
    
    const sampleCredential = await strapi.entityService.create('api::credential.credential', {
      data: {
        credentialId,
        name: 'Welcome to Certo',
        description: 'Congratulations! You have been awarded the Welcome to Certo badge for setting up your development environment.',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuanceDate: new Date(),
        narrative: 'This credential was automatically issued upon first setup of the Certo development environment. It serves as a sample credential to help you explore the platform features.',
        revoked: false,
        achievement: sampleAchievement.id,
        issuer: adminProfile.id,
        recipient: adminProfile.id,
        proof: [proof],
        publishedAt: new Date(),
      },
    });

    // Log success message
    strapi.log.info('='.repeat(60));
    strapi.log.info('[Seed] SEED DATA CREATED SUCCESSFULLY');
    strapi.log.info('='.repeat(60));
    strapi.log.info('[Seed] Login credentials (same for admin panel and frontend):');
    strapi.log.info(`[Seed]   Email:    ${DEFAULT_SEED_CONFIG.adminEmail}`);
    strapi.log.info(`[Seed]   Password: ${DEFAULT_SEED_CONFIG.adminPassword}`);
    strapi.log.info('[Seed] Sample data: Admin User, Profile, Achievement, Credential');
    strapi.log.info('='.repeat(60));

  } catch (error) {
    strapi.log.error('[Seed] Error seeding development data:', error instanceof Error ? error.message : String(error));
    strapi.log.error('[Seed] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error instanceof Error && error.stack) {
      strapi.log.error('[Seed] Stack:', error.stack);
    }
  }
}

export default seedDevelopmentData;
