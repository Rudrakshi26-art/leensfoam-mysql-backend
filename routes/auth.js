const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { connectMongo } = require('../config/mongo');

const router = express.Router();

// ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // Connect to MongoDB
    const db = await connectMongo();

    // Find admin in MongoDB
    const admin = await db.collection('admins').findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');

      return res.status(500).json({
        message: 'Server configuration error',
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: admin._id.toString(),
        email: admin.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;