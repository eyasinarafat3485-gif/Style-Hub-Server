const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('⚠️  MONGO_URI is not defined in environment variables.');
      return;
    }

    if (mongoUri.includes('<db_username>') || mongoUri.includes('<db_password>')) {
      console.warn('⚠️  MongoDB Notice: Please replace <db_username> and <db_password> in Backend/.env with your actual MongoDB Atlas credentials.');
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process in development to allow server to stay active
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
