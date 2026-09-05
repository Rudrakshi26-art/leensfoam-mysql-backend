require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function createAdmin() {
  try {
    const name = 'Leensfoam Admin';
    const email = 'admin@leensfoam.com';
    const password = 'Admin@123';

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    console.log('Admin created successfully');
    console.log('Email:', email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();