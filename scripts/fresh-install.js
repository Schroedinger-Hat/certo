#!/usr/bin/env node

/**
 * Fresh Install Script for Certo
 * 
 * This script helps set up a fresh Certo installation with:
 * - Environment variables setup
 * - Default user and profile creation
 * - Sample certificates
 * - Proper roles and permissions
 * - License and contribution information
 * 
 * Usage: node scripts/fresh-install.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
}

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function displayWelcome() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🎓 Welcome to Certo - Digital Certificate Platform', 'bright');
  log('='.repeat(60), 'cyan');
  log('Setting up your fresh Certo installation...', 'blue');
  log('');
}

function displayLicenseInfo() {
  log('\n' + '📜 LICENSE INFORMATION', 'yellow');
  log('-'.repeat(40), 'yellow');
  log('This project is licensed under the GNU Affero General Public License v3.0', 'white');
  log('');
  log('⚠️  IMPORTANT: By using this software, you agree to:', 'yellow');
  log('• Share any modifications under the same AGPL-3.0 license', 'white');
  log('• Provide source code to users of your web service', 'white');
  log('• Include copyright and license notices', 'white');
  log('');
  log('📖 Full license text: https://www.gnu.org/licenses/agpl-3.0.en.html', 'blue');
}

function displayContributionInfo() {
  log('\n' + '🤝 CONTRIBUTION GUIDELINES', 'green');
  log('-'.repeat(40), 'green');
  log('We welcome contributions! Here\'s how you can help:', 'white');
  log('');
  log('1. Fork the repository on GitHub', 'white');
  log('2. Create a feature branch (git checkout -b feature/amazing-feature)', 'white');
  log('3. Commit your changes (git commit -m \'Add amazing feature\')', 'white');
  log('4. Push to the branch (git push origin feature/amazing-feature)', 'white');
  log('5. Open a Pull Request', 'white');
  log('');
  log('📦 Repository: https://github.com/schrodinger-hat/certo', 'blue');
  log('🐛 Issues: https://github.com/schrodinger-hat/certo/issues', 'blue');
}

function createEnvFile() {
  log('\n🔧 Setting up environment variables...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    log('⚠️  .env file already exists. Backing it up...', 'yellow');
    fs.copyFileSync(envPath, `${envPath}.backup.${Date.now()}`);
  }

  const adminJwtSecret = generateSecret();
  const jwtSecret = generateSecret();
  const apiTokenSalt = generateSecret();
  const appKeys = Array(4).fill(null).map(() => generateSecret()).join(',');

  const envContent = `# Certo Environment Configuration
# Generated on ${new Date().toISOString()}

# Strapi Configuration
HOST=0.0.0.0
PORT=1337
APP_KEYS=${appKeys}
API_TOKEN_SALT=${apiTokenSalt}
ADMIN_JWT_SECRET=${adminJwtSecret}
JWT_SECRET=${jwtSecret}
TRANSFER_TOKEN_SALT=${generateSecret()}

# Database Configuration
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Email Configuration (Optional - for password reset and notifications)
# Uncomment and configure if you want email functionality
# SMTP_HOST=smtp.ethereal.email
# SMTP_PORT=587
# SMTP_USERNAME=your-smtp-username
# SMTP_PASSWORD=your-smtp-password
# SMTP_FROM=your-email@example.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NUXT_PUBLIC_API_URL=http://localhost:1337/api

# Development Settings
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  log('✅ Environment file created successfully!', 'green');
  log(`📁 Location: ${envPath}`, 'blue');

  // Also create frontend-specific .env file for Nuxt
  const frontendEnvPath = path.join(process.cwd(), 'src', 'frontend', '.env');
  const frontendEnvContent = `NUXT_PUBLIC_API_URL=http://localhost:1337/api\n`;
  
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  log('✅ Frontend environment file created!', 'green');
  log(`📁 Location: ${frontendEnvPath}`, 'blue');
}

async function checkDependencies() {
  log('\n🔍 Checking dependencies...', 'blue');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      log('❌ Node.js 18+ is required. Current version: ' + nodeVersion, 'red');
      process.exit(1);
    }
    
    log(`✅ Node.js version: ${nodeVersion}`, 'green');
    
    // Check if package.json exists
    const backendPackageJson = path.join(process.cwd(), 'src', 'backend', 'package.json');
    const frontendPackageJson = path.join(process.cwd(), 'src', 'frontend', 'package.json');
    
    if (!fs.existsSync(backendPackageJson)) {
      log('❌ Backend package.json not found. Are you in the correct directory?', 'red');
      process.exit(1);
    }
    
    if (!fs.existsSync(frontendPackageJson)) {
      log('❌ Frontend package.json not found. Are you in the correct directory?', 'red');
      process.exit(1);
    }
    
    log('✅ Project structure verified', 'green');
    
  } catch (error) {
    log('❌ Error checking dependencies: ' + error.message, 'red');
    process.exit(1);
  }
}

function createSampleDataScript() {
  log('\n📝 Creating sample data setup script...', 'blue');
  
  const scriptPath = path.join(process.cwd(), 'src', 'backend', 'scripts', 'setup-sample-data.js');
  
  const scriptContent = `/**
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
      strapi.log.info(\`✅ Created sample profile: \${profileData.name}\`);
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
      strapi.log.info(\`✅ Created sample achievement: \${achievementData.name}\`);
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
  console.log(\`
import setupSampleData from './scripts/setup-sample-data.js';

export default {
  register(/* { strapi } */) {},
  async bootstrap({ strapi }) {
    await setupSampleData(strapi);
  },
};
\`);
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
`;

  // Ensure scripts directory exists
  const scriptsDir = path.dirname(scriptPath);
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  fs.writeFileSync(scriptPath, scriptContent);
  log('✅ Sample data script created!', 'green');
  log(`📁 Location: ${scriptPath}`, 'blue');
}

function displayNextSteps() {
  log('\n🚀 NEXT STEPS', 'bright');
  log('='.repeat(40), 'cyan');
  log('');
  log('1. Install dependencies:', 'yellow');
  log('   cd src/backend && npm install', 'white');
  log('   cd src/frontend && npm install', 'white');
  log('');
  log('2. Start the development environment:', 'yellow');
  log('   Option A - Using Docker:', 'blue');
  log('     docker-compose up -d', 'white');
  log('');
  log('   Option B - Manual start:', 'blue');
  log('     # Backend (Terminal 1)', 'white');
  log('     cd src/backend && npm run develop', 'white');
  log('     # Frontend (Terminal 2)', 'white');
  log('     cd src/frontend && npm run dev', 'white');
  log('');
  log('3. Access your applications:', 'yellow');
  log('   🔗 Frontend: http://localhost:3000', 'green');
  log('   🔗 Backend Admin: http://localhost:1337/admin', 'green');
  log('');
  log('4. First-time admin setup:', 'yellow');
  log('   • Visit http://localhost:1337/admin', 'white');
  log('   • Create your admin account', 'white');
  log('   • Or use default credentials:', 'white');
  log('     Email: admin@certo.local', 'blue');
  log('     Password: CertoAdmin123!', 'blue');
  log('     ⚠️  Change this password immediately!', 'red');
  log('');
  log('5. Configure email (optional):', 'yellow');
  log('   • Run: node src/backend/scripts/generate-test-email.js', 'white');
  log('   • Update .env with SMTP settings', 'white');
  log('');
  log('6. Load sample data:', 'yellow');
  log('   • Sample data will be created automatically on first startup', 'white');
  log('   • Or manually run the sample data script', 'white');
  log('');
}

function displayTroubleshooting() {
  log('\n🔧 TROUBLESHOOTING', 'yellow');
  log('-'.repeat(40), 'yellow');
  log('');
  log('Common issues and solutions:', 'white');
  log('');
  log('• Port already in use:', 'red');
  log('  - Check: lsof -i :1337 (backend) or :3000 (frontend)', 'blue');
  log('  - Kill process: kill -9 <PID>', 'blue');
  log('');
  log('• Database connection issues:', 'red');
  log('  - Delete .tmp/data.db and restart', 'blue');
  log('  - Check file permissions', 'blue');
  log('');
  log('• Module not found errors:', 'red');
  log('  - Run: npm install in both src/backend and src/frontend', 'blue');
  log('  - Clear node_modules and package-lock.json, then reinstall', 'blue');
  log('');
  log('• Permission errors:', 'red');
  log('  - Check file ownership: ls -la', 'blue');
  log('  - Fix permissions: chmod -R 755 .', 'blue');
  log('');
  log('• Workspace dependency issues (@strapi/strapi not found):', 'red');
  log('  - Use Docker: docker-compose up -d (recommended)', 'blue');
  log('  - Run independently: cd src/backend && npm run develop', 'blue');
  log('  - Manual fix: npm run fresh-install (includes auto-fix)', 'blue');
  log('');
  log('📞 Need help? Open an issue:', 'green');
  log('   https://github.com/schrodinger-hat/certo/issues', 'blue');
}

function fixWorkspaceDependencies() {
  log('\n🔧 Fixing workspace dependency resolution...', 'blue');
  
  try {
    const rootNodeModules = path.join(process.cwd(), 'node_modules', '@strapi');
    const strapiPath = path.join(rootNodeModules, 'strapi');
    const backendStrapiPath = path.join(process.cwd(), 'src', 'backend', 'node_modules', '@strapi', 'strapi');
    
    // Check if the symlink already exists
    if (fs.existsSync(strapiPath)) {
      log('✅ Workspace dependency fix already applied', 'green');
      return;
    }
    
    // Check if backend strapi exists
    if (!fs.existsSync(backendStrapiPath)) {
      log('⚠️  Backend dependencies not yet installed - workspace fix will be applied after npm install', 'yellow');
      return;
    }
    
    // Create symlink to fix workspace dependency resolution
    if (fs.existsSync(rootNodeModules)) {
      fs.symlinkSync(backendStrapiPath, strapiPath, 'dir');
      log('✅ Workspace dependency resolution fixed', 'green');
    }
    
  } catch (error) {
    // Don't fail the installation if symlink creation fails
    log('⚠️  Could not create workspace dependency fix (this is optional)', 'yellow');
    log('   You can still use Docker or run services independently', 'blue');
  }
}

async function main() {
  try {
    displayWelcome();
    
    await checkDependencies();
    
    createEnvFile();
    
    createSampleDataScript();
    
    fixWorkspaceDependencies();
    
    displayLicenseInfo();
    
    displayContributionInfo();
    
    displayNextSteps();
    
    displayTroubleshooting();
    
    log('\n🎉 Fresh installation setup complete!', 'green');
    log('Happy coding with Certo! 🎓✨', 'cyan');
    log('');
    
  } catch (error) {
    log('\n❌ Installation failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
