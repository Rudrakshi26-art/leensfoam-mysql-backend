try {
  const app = require('../server');

  module.exports = app;
} catch (error) {
  console.error('SERVER STARTUP ERROR:', error);
  throw error;
}