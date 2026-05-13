const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 for local SMTP usage
dns.setDefaultResultOrder('ipv4first');

const sendEmail = async (options) => {
  // --- DEV MODE: No credentials at all ---
  if (!process.env.SMTP_USER && !process.env.BREVO_API_KEY && !process.env.RESEND_API_KEY) {
    console.warn('\n======================================================');
    console.warn('⚠️ No email credentials found in .env');
    console.warn('Simulating email delivery. OTP will be printed below:');
    console.warn(`To: ${options.email}`);
    console.warn(`Subject: ${options.subject}`);
    console.warn(`Message: ${options.message}`);
    console.warn('======================================================\n');
    return;
  }

  // --- PRODUCTION: Use Brevo HTTP API (works on Railway/Vercel/Render) ---
  if (process.env.BREVO_API_KEY) {
    console.log(`📧 Sending email via Brevo to ${options.email}...`);
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'noreply@airecruitment.com';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'AI Recruitment', email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        textContent: options.message,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Brevo API error:', data);
      throw new Error(data.message || 'Failed to send email via Brevo');
    }
    console.log(`✅ Email sent via Brevo: messageId=${data.messageId}`);
    return;
  }

  // --- ALTERNATIVE: Use Resend HTTP API ---
  if (process.env.RESEND_API_KEY) {
    console.log(`📧 Sending email via Resend to ${options.email}...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'AI Recruitment <onboarding@resend.dev>',
        to: [options.email],
        subject: options.subject,
        text: options.message,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Resend API error:', data);
      throw new Error(data.message || 'Failed to send email via Resend');
    }
    console.log(`✅ Email sent via Resend: ${data.id}`);
    return;
  }

  // --- LOCAL FALLBACK: Use Gmail SMTP (only works locally, not on cloud hosts) ---
  console.log(`📧 Sending email via SMTP to ${options.email}...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    family: 4,
  });

  const info = await transporter.sendMail({
    from: `"AI Recruitment" <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  });
  console.log(`✅ Email sent via SMTP: ${info.messageId}`);
};

module.exports = sendEmail;
