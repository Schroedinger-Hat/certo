/**
 * Sample Data Setup Script
 * 
 * This script creates sample data for Certo including:
 * - Default admin user
 * - Sample profiles
 * - Sample certificates/credentials
 * 
 * Run this after your first Strapi startup: node scripts/setup-sample-data.js
 */

const bcrypt = require('bcryptjs');

async function createDefaultUser(strapi) {
  try {
    // Check if admin user already exists
    const existingAdmin = await strapi.query('admin::user').findOne({
      where: { email: 'admin@certo.local' }
    });

    if (existingAdmin) {
      strapi.log.info('Default admin user already exists');
      return existingAdmin;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('CertoAdmin123!', 10);
    
    const adminUser = await strapi.query('admin::user').create({
      data: {
        firstname: 'Certo',
        lastname: 'Administrator',
        email: 'admin@certo.local',
        password: hashedPassword,
        isActive: true,
        blocked: false,
        preferedLanguage: 'en'
      }
    });

    strapi.log.info('✅ Default admin user created: admin@certo.local');
    strapi.log.info('🔑 Default password: CertoAdmin123!');
    strapi.log.warn('⚠️  Please change the default password after first login!');
    
    return adminUser;
  } catch (error) {
    strapi.log.error('Error creating default admin user:', error);
  }
}

async function createSampleProfiles(strapi) {
  try {
    // Check if sample profiles already exist
    const existingProfile = await strapi.query('api::profile.profile').findOne({
      where: { email: 'john.doe@example.com' }
    });

    if (existingProfile) {
      strapi.log.info('Sample profiles already exist');
      return;
    }

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
    
  } catch (error) {
    strapi.log.error('Error creating sample profiles:', error);
  }
}

async function createSampleAchievements(strapi) {
  try {
    // Check if sample achievements already exist
    const existingAchievement = await strapi.query('api::achievement.achievement').findOne({
      where: { name: 'Open Source Contributor' }
    });

    if (existingAchievement) {
      strapi.log.info('Sample achievements already exist');
      return;
    }

    // Create sample achievements
    const sampleAchievements = [
      {
        name: 'Open Source Contributor',
        description: 'Contributed to open source projects and helped build the developer community',
        criteria: 'Made meaningful contributions to open source repositories',
        image: '/uploads/badge-opensource.png'
      },
      {
        name: 'Workshop Completion',
        description: 'Successfully completed a technical workshop',
        criteria: 'Attended and participated in all workshop sessions',
        image: '/uploads/badge-workshop.png'
      },
      {
        name: 'Community Leader',
        description: 'Demonstrated leadership within the developer community',
        criteria: 'Organized events, mentored others, or led community initiatives',
        image: '/uploads/badge-leader.png'
      }
    ];

    for (const achievementData of sampleAchievements) {
      await strapi.query('api::achievement.achievement').create({
        data: achievementData
      });
      strapi.log.info(`✅ Created sample achievement: ${achievementData.name}`);
    }
    
  } catch (error) {
    strapi.log.error('Error creating sample achievements:', error);
  }
}

async function setupSampleData() {
  console.log('🎯 Setting up sample data for Certo...');
  
  // This function should be called from Strapi context
  // Example usage in bootstrap.js or as a Strapi script
  console.log('⚠️  This script should be run in Strapi context');
  console.log('💡 Add this to your src/index.ts bootstrap function:');
  console.log(`
import setupSampleData from './scripts/setup-sample-data.js';

export default {
  register(/* { strapi } */) {},
  async bootstrap({ strapi }) {
    await setupSampleData(strapi);
  },
};
`);
}

// Export functions for use in Strapi bootstrap
module.exports = {
  createDefaultUser,
  createSampleProfiles,
  createSampleAchievements,
  setupSampleData
};

// If called directly
if (require.main === module) {
  setupSampleData();
}
