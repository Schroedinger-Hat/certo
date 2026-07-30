#!/usr/bin/env node

/**
 * Test script to verify fresh install was successful
 * 
 * This script checks that all expected data was created:
 * - Admin user exists
 * - Issuer profile exists
 * - Issuer user exists
 * - Sample achievement exists
 * - Sample credential exists
 * - API permissions are set correctly
 */

const { CONFIG } = require('./fresh-install.js');

async function testFreshInstall() {
  console.log('🧪 Testing Fresh Install...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Initialize Strapi
    const strapi = require('@strapi/strapi');
    await strapi().load();
    
    let allTestsPassed = true;
    
    // Test 1: Check admin user
    console.log('1. Testing admin user...');
    const adminUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: CONFIG.admin.email }
    });
    
    if (adminUser) {
      console.log('   ✅ Admin user exists');
    } else {
      console.log('   ❌ Admin user not found');
      allTestsPassed = false;
    }
    
    // Test 2: Check issuer profile
    console.log('2. Testing issuer profile...');
    const issuerProfile = await strapi.query('api::profile.profile').findOne({
      where: { email: CONFIG.issuer.email }
    });
    
    if (issuerProfile) {
      console.log('   ✅ Issuer profile exists');
      console.log(`   📝 Organization: ${issuerProfile.name}`);
    } else {
      console.log('   ❌ Issuer profile not found');
      allTestsPassed = false;
    }
    
    // Test 3: Check issuer user
    console.log('3. Testing issuer user...');
    const issuerUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: CONFIG.issuer.email }
    });
    
    if (issuerUser) {
      console.log('   ✅ Issuer user exists');
    } else {
      console.log('   ❌ Issuer user not found');
      allTestsPassed = false;
    }
    
    // Test 4: Check sample achievement
    console.log('4. Testing sample achievement...');
    const achievement = await strapi.query('api::achievement.achievement').findOne({
      where: { name: CONFIG.sampleAchievement.name }
    });
    
    if (achievement) {
      console.log('   ✅ Sample achievement exists');
      console.log(`   📝 Achievement ID: ${achievement.achievementId}`);
    } else {
      console.log('   ❌ Sample achievement not found');
      allTestsPassed = false;
    }
    
    // Test 5: Check sample credential
    console.log('5. Testing sample credential...');
    const credential = await strapi.query('api::credential.credential').findOne({
      where: { name: CONFIG.sampleCredential.name }
    });
    
    if (credential) {
      console.log('   ✅ Sample credential exists');
      console.log(`   📝 Credential ID: ${credential.credentialId}`);
    } else {
      console.log('   ❌ Sample credential not found');
      allTestsPassed = false;
    }
    
    // Test 6: Check API permissions
    console.log('6. Testing API permissions...');
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' }
    });
    
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });
    
    if (publicRole && authenticatedRole) {
      console.log('   ✅ Roles exist');
      
      // Check some key permissions
      const publicPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
        where: {
          role: publicRole.id,
          enabled: true
        }
      });
      
      const authenticatedPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
        where: {
          role: authenticatedRole.id,
          enabled: true
        }
      });
      
      console.log(`   📝 Public permissions enabled: ${publicPermissions.length}`);
      console.log(`   📝 Authenticated permissions enabled: ${authenticatedPermissions.length}`);
    } else {
      console.log('   ❌ Roles not found');
      allTestsPassed = false;
    }
    
    // Test 7: Check relationships
    console.log('7. Testing relationships...');
    if (achievement && issuerProfile) {
      const achievementWithCreator = await strapi.query('api::achievement.achievement').findOne({
        where: { id: achievement.id },
        populate: ['creator']
      });
      
      if (achievementWithCreator.creator && achievementWithCreator.creator.id === issuerProfile.id) {
        console.log('   ✅ Achievement creator relationship is correct');
      } else {
        console.log('   ❌ Achievement creator relationship is incorrect');
        allTestsPassed = false;
      }
    }
    
    if (credential && issuerProfile && achievement) {
      const credentialWithRelations = await strapi.query('api::credential.credential').findOne({
        where: { id: credential.id },
        populate: ['issuer', 'achievement']
      });
      
      if (credentialWithRelations.issuer && credentialWithRelations.achievement) {
        console.log('   ✅ Credential issuer and achievement relationships are correct');
      } else {
        console.log('   ❌ Credential relationships are incorrect');
        allTestsPassed = false;
      }
    }
    
    // Final results
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allTestsPassed) {
      console.log('🎉 All tests passed! Fresh install was successful.');
      console.log('\n📋 Summary:');
      console.log(`   • Admin user: ${adminUser ? '✅' : '❌'}`);
      console.log(`   • Issuer profile: ${issuerProfile ? '✅' : '❌'}`);
      console.log(`   • Issuer user: ${issuerUser ? '✅' : '❌'}`);
      console.log(`   • Sample achievement: ${achievement ? '✅' : '❌'}`);
      console.log(`   • Sample credential: ${credential ? '✅' : '❌'}`);
      console.log(`   • API permissions: ${publicRole && authenticatedRole ? '✅' : '❌'}`);
      console.log('\n🚀 You can now:');
      console.log('   1. Access admin panel: http://localhost:1337/admin');
      console.log('   2. Test API endpoints: http://localhost:1337/api');
      console.log('   3. Start the frontend: docker-compose up frontend -d');
    } else {
      console.log('❌ Some tests failed. Please check the errors above.');
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure the backend is running: docker-compose up backend -d');
      console.log('   2. Run fresh install again: docker exec -it certo_backend npm run fresh-install');
      console.log('   3. Check logs: docker-compose logs backend');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(allTestsPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test if called directly
if (require.main === module) {
  testFreshInstall();
}

module.exports = {
  testFreshInstall
}; 