const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { pool } = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const uploadFolder = path.join(
  __dirname,
  '../public/assets/products'
);

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

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

    const safeName = originalName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

    cb(
      null,
      `${safeName}-${Date.now()}${extension}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only JPG, PNG and WEBP images are allowed'
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const getImageUrl = (req, filename) => {
  if (!filename) return null;

  const baseUrl =
    process.env.PUBLIC_API_URL ||
    `${req.protocol}://${req.get('host')}`;

  return `${baseUrl}/assets/products/${encodeURIComponent(
    filename
  )}`;
};


// ===============================
// GET ALL PRODUCTS
// ===============================

router.get('/', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    res.json(
      products.map((product) => ({
        ...product,

        // Keep _id for frontend compatibility
        _id: String(product.id),

        desc: product.description,

        imageUrl: getImageUrl(
          req,
          product.image
        ),
      }))
    );
  } catch (error) {
    console.error(
      'Get products error:',
      error
    );

    res.status(500).json({
      message: 'Failed to get products',
    });
  }
});


// ===============================
// UPLOAD PRODUCT IMAGE
// ===============================

router.post(
  '/upload-image',
  authenticateToken,
  (req, res) => {
    upload.single('image')(
      req,
      res,
      (error) => {
        if (error) {
          console.error(
            'Image upload error:',
            error
          );

          return res.status(400).json({
            message:
              error.message ||
              'Failed to upload image',
          });
        }

        if (!req.file) {
          return res.status(400).json({
            message: 'No image uploaded',
          });
        }

        const imageUrl = getImageUrl(
          req,
          req.file.filename
        );

        res.status(201).json({
          message:
            'Image uploaded successfully',

          filename: req.file.filename,

          path: `/assets/products/${req.file.filename}`,

          imageUrl,
        });
      }
    );
  }
);


// ===============================
// ADD PRODUCT
// ===============================

router.post(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        id,
        cat,
        tag,
        name,
        description,
        image,
        c1,
        c2,
      } = req.body;

      if (
        !id ||
        !cat ||
        !tag ||
        !name ||
        !description
      ) {
        return res.status(400).json({
          message:
            'id, cat, tag, name and description are required',
        });
      }

      // Check duplicate product ID
      const [existingProducts] = await pool.execute(
        'SELECT id FROM products WHERE id = ? LIMIT 1',
        [id]
      );

      if (existingProducts.length > 0) {
        return res.status(409).json({
          message: 'Product ID already exists',
        });
      }

      const [result] = await pool.execute(
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
          c2 || null,
        ]
      );

      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE id = ? LIMIT 1',
        [id]
      );

      const product = rows[0];

      res.status(201).json({
        message:
          'Product created successfully',

        product: {
          ...product,

          _id: String(product.id),

          desc: product.description,

          imageUrl: getImageUrl(
            req,
            product.image
          ),
        },
      });
    } catch (error) {
      console.error(
        'Create product error:',
        error
      );

      res.status(500).json({
        message: 'Failed to create product',
      });
    }
  }
);


// ===============================
// UPDATE PRODUCT
// ===============================

router.put(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const productId = req.params.id;

      const {
        cat,
        tag,
        name,
        description,
        image,
        c1,
        c2,
      } = req.body;

      if (
        !cat ||
        !tag ||
        !name ||
        !description
      ) {
        return res.status(400).json({
          message:
            'cat, tag, name and description are required',
        });
      }

      const [result] = await pool.execute(
        `UPDATE products
        SET cat = ?,
            tag = ?,
            name = ?,
            description = ?,
            image = ?,
            c1 = ?,
            c2 = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          cat,
          tag,
          name,
          description,
          image || null,
          c1 || null,
          c2 || null,
          productId,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: 'Product not found',
        });
      }

      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE id = ? LIMIT 1',
        [productId]
      );

      const updatedProduct = rows[0];

      res.json({
        message:
          'Product updated successfully',

        product: {
          ...updatedProduct,

          _id: String(updatedProduct.id),

          desc: updatedProduct.description,

          imageUrl: getImageUrl(
            req,
            updatedProduct.image
          ),
        },
      });
    } catch (error) {
      console.error(
        'Update product error:',
        error
      );

      res.status(500).json({
        message: 'Failed to update product',
      });
    }
  }
);


// ===============================
// DELETE PRODUCT
// ===============================

router.delete(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const productId = req.params.id;

      const [result] = await pool.execute(
        'DELETE FROM products WHERE id = ?',
        [productId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: 'Product not found',
        });
      }

      res.json({
        message:
          'Product deleted successfully',
      });
    } catch (error) {
      console.error(
        'Delete product error:',
        error
      );

      res.status(500).json({
        message: 'Failed to delete product',
      });
    }
  }
);

module.exports = router;