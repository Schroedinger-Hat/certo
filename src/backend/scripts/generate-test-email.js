/**
 * This script creates a test email account on Ethereal.email
 * Run this script with: node scripts/generate-test-email.js
 */

const nodemailer = require('nodemailer');

async function createTestAccount() {
  console.log('Creating test email account on Ethereal.email...');
  
  try {
    // Create a test account on Ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Test account created successfully!');
    console.log('\nAdd these values to your .env file:');
    console.log(`SMTP_HOST=smtp.ethereal.email`);
    console.log(`SMTP_PORT=587`);
    console.log(`SMTP_USERNAME=${testAccount.user}`);
    console.log(`SMTP_PASSWORD=${testAccount.pass}`);
    console.log(`SMTP_FROM=${testAccount.user}`);
    console.log('\nYou can view sent emails at:');
    console.log(`https://ethereal.email/login`);
    console.log('Login with the credentials above.');
  } catch (error) {
    console.error('Error creating test account:', error);
  }
}

createTestAccount(); 