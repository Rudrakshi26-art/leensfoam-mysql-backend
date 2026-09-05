require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();

// =====================================================
// CORS
// =====================================================

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://leensfoam-website.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// =====================================================
// BODY PARSING
// =====================================================

app.use(express.json());

// =====================================================
// SERVE PUBLIC ASSETS
// =====================================================

app.use(
  '/assets',
  express.static(
    path.join(__dirname, '../public/assets')
  )
);

// =====================================================
// TEST BACKEND
// =====================================================

app.get('/', (req, res) => {
  res.json({
    message: 'Leensfoam backend is running'
  });
});

// =====================================================
// AUTH ROUTES
// =====================================================

app.use('/api/auth', authRoutes);

// =====================================================
// PRODUCT ROUTES
// =====================================================

app.use('/api/products', productRoutes);

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});