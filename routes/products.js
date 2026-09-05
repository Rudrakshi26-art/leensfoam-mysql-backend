const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();


// =====================================================
// IMAGE UPLOAD SETUP
// =====================================================

const uploadFolder = path.join(
  __dirname,
  '../../public/assets/products'
);

// Create folder if it doesn't exist
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}


// =====================================================
// STORE UPLOADED IMAGES WITH UNIQUE FILENAMES
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const originalName = path.basename(
      file.originalname,
      extension
    );

    // Make filename safe for URLs/filesystems
    const safeName = originalName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

    // Add timestamp so existing files are NEVER overwritten
    const uniqueName = `${safeName}-${Date.now()}${extension}`;

    cb(null, uniqueName);
  }
});


// =====================================================
// ALLOW ONLY IMAGE FILES
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG and WEBP images are allowed'));
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


// =====================================================
// GET ALL PRODUCTS
// Public route
// =====================================================

router.get('/', async (req, res) => {
  try {
    const [products] = await db.execute(
      `SELECT 
        id,
        cat,
        tag,
        name,
        description,
        image,
        c1,
        c2,
        created_at,
        updated_at
      FROM products
      ORDER BY created_at DESC`
    );

    res.json(products);

  } catch (error) {
    console.error('Get products error:', error);

    res.status(500).json({
      message: 'Failed to get products'
    });
  }
});


// =====================================================
// UPLOAD PRODUCT IMAGE
// Admin only
// =====================================================

router.post(
  '/upload-image',
  authenticateToken,
  (req, res) => {

    upload.single('image')(req, res, (error) => {

      if (error) {
        console.error('Image upload error:', error);

        return res.status(400).json({
          message: error.message || 'Failed to upload image'
        });
      }

      try {

        if (!req.file) {
          return res.status(400).json({
            message: 'No image uploaded'
          });
        }

        res.status(201).json({
          message: 'Image uploaded successfully',
          filename: req.file.filename,
          path: `/assets/products/${req.file.filename}`
        });

      } catch (error) {

        console.error('Image upload error:', error);

        res.status(500).json({
          message: 'Failed to upload image'
        });

      }

    });

  }
);


// =====================================================
// ADD PRODUCT
// Admin only
// =====================================================

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      id,
      cat,
      tag,
      name,
      description,
      image,
      c1,
      c2
    } = req.body;

    if (!id || !cat || !tag || !name || !description) {
      return res.status(400).json({
        message: 'id, cat, tag, name and description are required'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO products
      (id, cat, tag, name, description, image, c1, c2)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cat,
        tag,
        name,
        description,
        image || null,
        c1 || null,
        c2 || null
      ]
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: id
    });

  } catch (error) {
    console.error('Create product error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Product ID already exists'
      });
    }

    res.status(500).json({
      message: 'Failed to create product'
    });
  }
});


// =====================================================
// UPDATE PRODUCT
// Admin only
// =====================================================

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;

    const {
      cat,
      tag,
      name,
      description,
      image,
      c1,
      c2
    } = req.body;

    if (!cat || !tag || !name || !description) {
      return res.status(400).json({
        message: 'cat, tag, name and description are required'
      });
    }

    const [result] = await db.execute(
      `UPDATE products
      SET
        cat = ?,
        tag = ?,
        name = ?,
        description = ?,
        image = ?,
        c1 = ?,
        c2 = ?
      WHERE id = ?`,
      [
        cat,
        tag,
        name,
        description,
        image || null,
        c1 || null,
        c2 || null,
        productId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);

    res.status(500).json({
      message: 'Failed to update product'
    });
  }
});


// =====================================================
// DELETE PRODUCT
// Admin only
// =====================================================

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);

    res.status(500).json({
      message: 'Failed to delete product'
    });
  }
});


module.exports = router;