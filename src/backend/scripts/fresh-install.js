#!/usr/bin/env node

/**
 * Fresh Install Script for Certo Strapi Backend
 * 
 * This script sets up a complete Strapi instance with:
 * - Admin user
 * - Issuer profile
 * - Issuer user (same email and organization)
 * - Sample credential created by the issuer profile
 * - Proper API permissions for public, issuer, and authenticated users
 * 
 * Usage: node scripts/fresh-install.js
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Configuration
const CONFIG = {
  admin: {
    email: 'admin@certo.com',
    password: 'Admin123!',
    firstname: 'Admin',
    lastname: 'User'
  },
  issuer: {
    email: 'issuer@certo.com',
    password: 'Issuer123!',
    firstname: 'Sample',
    lastname: 'Issuer',
    organization: 'Certo Demo Organization',
    description: 'A sample issuer organization for demonstration purposes'
  },
  sampleAchievement: {
    name: 'Web Development Fundamentals',
    description: 'Demonstrates proficiency in HTML, CSS, and JavaScript fundamentals',
    achievementType: 'Achievement',
    tags: ['web-development', 'frontend', 'programming']
  },
  sampleCredential: {
    name: 'Web Development Fundamentals Certificate',
    description: 'Certificate awarded for completing the Web Development Fundamentals course',
    narrative: 'This credential was awarded to demonstrate mastery of web development fundamentals including HTML, CSS, and JavaScript.'
  }
};

/**
 * Generate a secure random string
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a UUID in the required format
 */
function generateCredentialId() {
  return `urn:uuid:${uuidv4()}`;
}

/**
 * Create admin user
 */
async function createAdminUser(strapi) {
  console.log('Creating admin user...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: CONFIG.admin.email }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation');
      return existingAdmin;
    }

    // Create admin user
    const adminUser = await strapi.query('plugin::users-permissions.user').create({
      data: {
        username: 'admin',
        email: CONFIG.admin.email,
        password: CONFIG.admin.password,
        confirmed: true,
        blocked: false,
        role: 1, // Admin role
        provider: 'local'
      }
    });

    console.log('✅ Admin user created successfully');
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

/**
 * Create issuer profile
 */
async function createIssuerProfile(strapi) {
  console.log('Creating issuer profile...');
  
  try {
    // Check if issuer profile already exists
    const existingProfile = await strapi.query('api::profile.profile').findOne({
      where: { email: CONFIG.issuer.email }
    });

    if (existingProfile) {
      console.log('Issuer profile already exists, skipping creation');
      return existingProfile;
    }

    // Create issuer profile
    const issuerProfile = await strapi.query('api::profile.profile').create({
      data: {
        name: CONFIG.issuer.organization,
        email: CONFIG.issuer.email,
        description: CONFIG.issuer.description,
        profileType: 'Issuer',
        url: 'https://certo-demo.org',
        telephone: '+1-555-0123',
        did: `did:web:certo-demo.org:${generateRandomString(16)}`,
        publishedAt: new Date()
      }
    });

    console.log('✅ Issuer profile created successfully');
    return issuerProfile;
  } catch (error) {
    console.error('❌ Error creating issuer profile:', error);
    throw error;
  }
}

/**
 * Create issuer user
 */
async function createIssuerUser(strapi) {
  console.log('Creating issuer user...');
  
  try {
    // Check if issuer user already exists
    const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: CONFIG.issuer.email }
    });

    if (existingUser) {
      console.log('Issuer user already exists, skipping creation');
      return existingUser;
    }

    // Create issuer user
    const issuerUser = await strapi.query('plugin::users-permissions.user').create({
      data: {
        username: 'issuer',
        email: CONFIG.issuer.email,
        password: CONFIG.issuer.password,
        confirmed: true,
        blocked: false,
        role: 1, // Authenticated role (will be updated to issuer role if exists)
        provider: 'local'
      }
    });

    console.log('✅ Issuer user created successfully');
    return issuerUser;
  } catch (error) {
    console.error('❌ Error creating issuer user:', error);
    throw error;
  }
}

/**
 * Create sample achievement
 */
async function createSampleAchievement(strapi, issuerProfile) {
  console.log('Creating sample achievement...');
  
  try {
    // Check if sample achievement already exists
    const existingAchievement = await strapi.query('api::achievement.achievement').findOne({
      where: { name: CONFIG.sampleAchievement.name }
    });

    if (existingAchievement) {
      console.log('Sample achievement already exists, skipping creation');
      return existingAchievement;
    }

    // Create sample achievement
    const achievement = await strapi.query('api::achievement.achievement').create({
      data: {
        name: CONFIG.sampleAchievement.name,
        description: CONFIG.sampleAchievement.description,
        achievementType: CONFIG.sampleAchievement.achievementType,
        tags: CONFIG.sampleAchievement.tags,
        achievementId: 'web-development-fundamentals',
        creator: issuerProfile.id,
        criteria: {
          narrative: 'The recipient has demonstrated proficiency in web development fundamentals including HTML, CSS, and JavaScript. This includes understanding of semantic HTML, responsive design principles, and basic JavaScript programming concepts.'
        },
        skills: [
          {
            name: 'HTML',
            description: 'HyperText Markup Language for structuring web content'
          },
          {
            name: 'CSS',
            description: 'Cascading Style Sheets for styling web content'
          },
          {
            name: 'JavaScript',
            description: 'Programming language for web interactivity'
          }
        ],
        alignment: [
          {
            targetName: 'Web Development Standards',
            targetUrl: 'https://www.w3.org/standards/',
            targetDescription: 'World Wide Web Consortium standards for web development',
            targetCode: 'WEB-DEV-001'
          }
        ],
        publishedAt: new Date()
      }
    });

    console.log('✅ Sample achievement created successfully');
    return achievement;
  } catch (error) {
    console.error('❌ Error creating sample achievement:', error);
    throw error;
  }
}

/**
 * Create sample credential
 */
async function createSampleCredential(strapi, issuerProfile, achievement) {
  console.log('Creating sample credential...');
  
  try {
    // Check if sample credential already exists
    const existingCredential = await strapi.query('api::credential.credential').findOne({
      where: { name: CONFIG.sampleCredential.name }
    });

    if (existingCredential) {
      console.log('Sample credential already exists, skipping creation');
      return existingCredential;
    }

    // Create sample credential
    const credential = await strapi.query('api::credential.credential').create({
      data: {
        credentialId: generateCredentialId(),
        name: CONFIG.sampleCredential.name,
        description: CONFIG.sampleCredential.description,
        narrative: CONFIG.sampleCredential.narrative,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuanceDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        issuer: issuerProfile.id,
        recipient: issuerProfile.id, // For demo purposes, issuer is also recipient
        achievement: achievement.id,
        revoked: false,
        proof: [
          {
            type: 'Ed25519Signature2020',
            created: new Date().toISOString(),
            verificationMethod: `did:web:certo-demo.org:${generateRandomString(16)}#key-1`,
            proofPurpose: 'assertionMethod',
            proofValue: generateRandomString(64)
          }
        ],
        publishedAt: new Date()
      }
    });

    console.log('✅ Sample credential created successfully');
    return credential;
  } catch (error) {
    console.error('❌ Error creating sample credential:', error);
    throw error;
  }
}

/**
 * Setup API permissions
 */
async function setupApiPermissions(strapi) {
  console.log('Setting up API permissions...');
  
  try {
    // Get roles
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' }
    });

    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });

    if (!publicRole || !authenticatedRole) {
      throw new Error('Required roles not found');
    }

    // Define permissions for public access
    const publicPermissions = [
      { action: 'find', subject: 'api::achievement.achievement' },
      { action: 'findOne', subject: 'api::achievement.achievement' },
      { action: 'find', subject: 'api::profile.profile' },
      { action: 'findOne', subject: 'api::profile.profile' },
      { action: 'find', subject: 'api::credential.credential' },
      { action: 'findOne', subject: 'api::credential.credential' },
      { action: 'verify', subject: 'api::credential.credential' },
      { action: 'validate', subject: 'api::credential.credential' },
      { action: 'find', subject: 'api::evidence.evidence' },
      { action: 'findOne', subject: 'api::evidence.evidence' },
      { action: 'find', subject: 'api::revocation-list.revocation-list' },
      { action: 'findOne', subject: 'api::revocation-list.revocation-list' }
    ];

    // Define permissions for authenticated users
    const authenticatedPermissions = [
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
      
      // Credential actions
      { action: 'create', subject: 'api::credential.credential' },
      { action: 'update', subject: 'api::credential.credential' },
      { action: 'delete', subject: 'api::credential.credential' },
      { action: 'issue', subject: 'api::credential.credential' },
      { action: 'validate', subject: 'api::credential.credential' },
      { action: 'verify', subject: 'api::credential.credential' },
      { action: 'import', subject: 'api::credential.credential' },
      { action: 'export', subject: 'api::credential.credential' },
      { action: 'revoke', subject: 'api::credential.credential' },
      
      // Profile actions
      { action: 'create', subject: 'api::profile.profile' },
      { action: 'update', subject: 'api::profile.profile' },
      
      // Achievement actions
      { action: 'create', subject: 'api::achievement.achievement' },
      { action: 'update', subject: 'api::achievement.achievement' },
      { action: 'delete', subject: 'api::achievement.achievement' }
    ];

    // Enable public permissions
    for (const permission of publicPermissions) {
      await enablePermission(strapi, publicRole.id, permission.action, permission.subject);
    }

    // Enable authenticated permissions
    for (const permission of authenticatedPermissions) {
      await enablePermission(strapi, authenticatedRole.id, permission.action, permission.subject);
    }

    console.log('✅ API permissions setup complete');
  } catch (error) {
    console.error('❌ Error setting up API permissions:', error);
    throw error;
  }
}

/**
 * Enable a specific permission
 */
async function enablePermission(strapi, roleId, action, subject) {
  try {
    // Find existing permission
    const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
      where: {
        action: `${subject}.${action}`,
        role: roleId
      }
    });

    if (existingPermission) {
      // Update existing permission
      await strapi.query('plugin::users-permissions.permission').update({
        where: { id: existingPermission.id },
        data: { enabled: true }
      });
    } else {
      // Create new permission
      await strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `${subject}.${action}`,
          subject: subject,
          role: roleId,
          enabled: true
        }
      });
    }
  } catch (error) {
    console.warn(`Warning: Could not set permission ${subject}.${action}:`, error.message);
  }
}

/**
 * Display setup information
 */
function displaySetupInfo() {
  console.log('\n🎉 Fresh install completed successfully!');
  console.log('\n📋 Setup Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔐 Admin User:`);
  console.log(`   Email: ${CONFIG.admin.email}`);
  console.log(`   Password: ${CONFIG.admin.password}`);
  console.log(`   Access: http://localhost:1337/admin`);
  console.log('');
  console.log(`👤 Issuer User:`);
  console.log(`   Email: ${CONFIG.issuer.email}`);
  console.log(`   Password: ${CONFIG.issuer.password}`);
  console.log(`   Organization: ${CONFIG.issuer.organization}`);
  console.log('');
  console.log(`🏆 Sample Achievement:`);
  console.log(`   Name: ${CONFIG.sampleAchievement.name}`);
  console.log(`   Description: ${CONFIG.sampleAchievement.description}`);
  console.log('');
  console.log(`📜 Sample Credential:`);
  console.log(`   Name: ${CONFIG.sampleCredential.name}`);
  console.log(`   Description: ${CONFIG.sampleCredential.description}`);
  console.log('');
  console.log('🔗 API Endpoints:');
  console.log('   • Profiles: http://localhost:1337/api/profiles');
  console.log('   • Credentials: http://localhost:1337/api/credentials');
  console.log('   • Achievements: http://localhost:1337/api/achievements');
  console.log('');
  console.log('📝 License Information:');
  console.log('   This project is licensed under the GNU AGPL-3.0 License.');
  console.log('   If you make any changes, please consider contributing back to this repository.');
  console.log('   Repository: https://github.com/Schroedinger-Hat/certo');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('   1. Start the application: docker-compose up');
  console.log('   2. Access the admin panel: http://localhost:1337/admin');
  console.log('   3. Explore the API documentation');
  console.log('   4. Test the sample credential verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Main setup function
 */
async function runFreshInstall() {
  console.log('🚀 Starting Certo Fresh Install...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Initialize Strapi
    const strapi = require('@strapi/strapi');
    await strapi().load();
    
    // Run setup steps
    const adminUser = await createAdminUser(strapi);
    const issuerProfile = await createIssuerProfile(strapi);
    const issuerUser = await createIssuerUser(strapi);
    const achievement = await createSampleAchievement(strapi, issuerProfile);
    const credential = await createSampleCredential(strapi, issuerProfile, achievement);
    await setupApiPermissions(strapi);
    
    // Display results
    displaySetupInfo();
    
    console.log('\n✅ Fresh install completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fresh install failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  runFreshInstall();
}

module.exports = {
  runFreshInstall,
  CONFIG
}; 