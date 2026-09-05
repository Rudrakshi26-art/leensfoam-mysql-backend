const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    rejectUnauthorized: false,
  },
});

const db = pool.promise();

db.getConnection()
  .then((connection) => {
    console.log('MySQL database connected successfully');
    connection.release();
  })
  .catch((error) => {
    console.error('MySQL connection failed:', error.message);
  });

module.exports = db;