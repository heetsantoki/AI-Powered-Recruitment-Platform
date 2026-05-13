const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    html: options.html, // Optional HTML format
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
