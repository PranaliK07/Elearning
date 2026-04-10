const sendEmail = require('../utils/sendEmail');

const sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Name, email, and message are required.' });
  }

  const toAddress = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
  if (!toAddress) {
    return res.status(500).json({ status: 'error', message: 'Email service is not configured.' });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-line;">${message}</p>
    </div>
  `;

  const result = await sendEmail({
    to: toAddress,
    subject: `Contact Form: ${name}`,
    html
  });

  if (!result.success) {
    return res.status(500).json({ status: 'error', message: 'Unable to send message. Email not configured.' });
  }

  return res.status(200).json({ status: 'success', message: 'Message sent successfully.' });
};

module.exports = { sendContactMessage };
