const nodemailer = require('nodemailer');

const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!hasSmtpConfig) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

/**
 * Sends an email if SMTP_* env vars are set; otherwise logs it to the
 * console so local development still works end-to-end without a real
 * mail account. Swap in a transactional email API (Postmark, Resend,
 * SES) here instead of SMTP if you'd rather not run your own relay.
 */
async function sendMail({ to, subject, text, html }) {
  const smtp = getTransporter();

  if (!smtp) {
    console.log('\n--- DEV EMAIL (SMTP not configured, printing instead) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('--- END DEV EMAIL ---\n');
    return { devMode: true };
  }

  return smtp.sendMail({
    from: process.env.MAIL_FROM || 'GoEazy <no-reply@goeazy.app>',
    to,
    subject,
    text,
    html: html || undefined
  });
}

module.exports = { sendMail, hasSmtpConfig };