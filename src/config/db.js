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

    // Set buffer timeout to 5s instead of 10s so queries fail fast if connection drops
    mongoose.set('bufferTimeoutMS', 5000);

    // Event Listeners for DB Connection Health
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected! Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully!');
    });

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
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
