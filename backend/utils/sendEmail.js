const nodemailer = require('nodemailer');
const dns = require('dns');
const { lookup } = require('dns/promises');

// Force Node.js to resolve IPv4 addresses first (Railway has no IPv6 outbound)
dns.setDefaultResultOrder('ipv4first');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
    family: 4,
    // Custom DNS lookup to guarantee IPv4
    dnsLookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });
};

const sendEmail = async (options) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('\n======================================================');
    console.warn('⚠️ SMTP Credentials not found in .env');
    console.warn('Simulating email delivery. OTP will be printed below:');
    console.warn(`To: ${options.email}`);
    console.warn(`Subject: ${options.subject}`);
    console.warn(`Message: ${options.message}`);
    console.warn('======================================================\n');
    return;
  }

  const mailOptions = {
    from: `"AI Recruitment" <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  console.log(`📧 Sending email to ${options.email}...`);
  const transporter = createTransporter();
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent successfully: ${info.messageId}`);
};

module.exports = sendEmail;
