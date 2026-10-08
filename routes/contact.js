const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      interest,
      message,
    } = req.body;

    // Validate form
    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.',
      });
    }

    // Check environment variables
    if (!process.env.MAIL_USER) {
      console.error('MAIL_USER is missing');
      return res.status(500).json({
        success: false,
        message: 'MAIL_USER is not configured on the server.',
      });
    }

    if (!process.env.MAIL_PASSWORD) {
      console.error('MAIL_PASSWORD is missing');
      return res.status(500).json({
        success: false,
        message: 'MAIL_PASSWORD is not configured on the server.',
      });
    }

    if (!process.env.MAIL_TO) {
      console.error('MAIL_TO is missing');
      return res.status(500).json({
        success: false,
        message: 'MAIL_TO is not configured on the server.',
      });
    }

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // Verify Gmail connection
    await transporter.verify();

    console.log('Gmail transporter verified successfully');

    // Send email
    const info = await transporter.sendMail({
      from: `"Leensfoam Website" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `New Leensfoam Enquiry - ${interest || 'General Enquiry'}`,

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

    console.log('Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
    });

  } catch (error) {
    console.error('====================================');
    console.error('CONTACT FORM ERROR');
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.error('Message:', error.message);
    console.error('====================================');

    return res.status(500).json({
      success: false,
      message: 'Unable to send message.',
    });
  }
});

module.exports = router;
