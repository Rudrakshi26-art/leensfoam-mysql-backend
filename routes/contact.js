const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      interest,
      message,
    } = req.body;

    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.',
      });
    }

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `New Leensfoam Enquiry - ${interest}`,
      text: `
New enquiry received from the Leensfoam website.

Name: ${name}
Phone: ${phone}
Email: ${email}
Interested In: ${interest}

Message:
${message}
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
    });

  } catch (error) {
    console.error('Email sending error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to send message.',
    });
  }
});

module.exports = router;