require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function testEmail() {
  console.log('Using SMTP_USER:', process.env.SMTP_USER);
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('No SMTP credentials found in .env');
    return;
  }
  
  try {
    await sendEmail({
      email: process.env.SMTP_USER, // send to themselves to test
      subject: 'Test Email from Local',
      message: 'This is a test email to verify credentials.',
    });
    console.log('Test email sent successfully! Credentials are valid.');
  } catch (error) {
    console.error('Failed to send test email. Credentials might be invalid or network blocked:', error);
  }
}

testEmail();
