require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectMongo } = require('./config/mongo');

async function createAdmin() {
  try {
    const db = await connectMongo();

    const name = 'Leensfoam Admin';
    const email = 'admin@leensfoam.com';
    const password = 'Admin@123';

    const existingAdmin = await db.collection('admins').findOne({
      email: email.toLowerCase(),
    });

    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('admins').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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