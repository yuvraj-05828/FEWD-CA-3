const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cook_recipe_db';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Only exit in production; in testing we handle connections in test runner
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
