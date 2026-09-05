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

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://leensfoam-new-website.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


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
// EXPORT APP FOR VERCEL
// =====================================================

module.exports = app;


// =====================================================
// LOCAL DEVELOPMENT ONLY
// =====================================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}