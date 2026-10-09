
const express = require('express');
const { Resend } = require('resend');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, interest, message } = req.body;

    // Validate required fields
    if (
      !name?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.',
      });
    }

    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    // Check Resend configuration
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing');

      return res.status(500).json({
        success: false,
        message: 'Email service is not configured.',
      });
    }

    if (!process.env.MAIL_TO) {
      console.error('MAIL_TO is missing');

      return res.status(500).json({
        success: false,
        message: 'Recipient email is not configured.',
      });
    }

    if (!process.env.MAIL_FROM) {
      console.error('MAIL_FROM is missing');

      return res.status(500).json({
        success: false,
        message: 'Sender email is not configured.',
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM,
      to: [process.env.MAIL_TO],
      replyTo: email.trim(),
      subject: `New Leensfoam Enquiry - ${
        interest || 'General Enquiry'
      }`,
      text: `
New enquiry received from the Leensfoam website.

Name: ${name}
Phone: ${phone}
Email: ${email}
Interested In: ${interest || 'Not specified'}

Message:
${message}
      `,
    });

    if (error) {
      console.error('Resend email error:', error);

      return res.status(502).json({
        success: false,
        message: 'Unable to send message. Please try again later.',
      });
    }

    console.log('Contact email accepted by Resend:', data.id);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
    });
  } catch (error) {
    console.error('Contact form error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to send message. Please try again later.',
    });
  }
});

module.exports = router;
