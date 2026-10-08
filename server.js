require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');

const app = express();

// Connect to // Connect to MySQL
connectDB();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use(
  '/assets',
  express.static(
    path.join(__dirname, 'public/assets')
  )
);

app.get('/', (req, res) => {
  res.json({
    message: 'Leensfoam backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
