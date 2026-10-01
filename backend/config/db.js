const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('\n============================================================');
    console.error('[CRITICAL CONFIG] MONGODB_URI environment variable is missing!');
    console.error('If running on Render:');
    console.error('  1. Go to Render Dashboard -> Select your Web Service');
    console.error('  2. Click the "Environment" tab');
    console.error('  3. Click "Add Environment Variable"');
    console.error('  4. Set Key: MONGODB_URI');
    console.error('  5. Set Value: your MongoDB Atlas connection string');
    console.error('============================================================\n');
  }

  const targetUri = mongoUri || 'mongodb://127.0.0.1:27017/cook_recipe_db';

  try {
    const conn = await mongoose.connect(targetUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (!process.env.MONGODB_URI) {
      console.error('[MongoDB] Reason: MONGODB_URI was not provided in environment variables.');
    }
    return null;
  }
};

module.exports = connectDB;

