const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('⚠️  MONGO_URI is not defined in environment variables.');
    return null;
  }

  if (mongoUri.includes('<db_username>') || mongoUri.includes('<db_password>')) {
    console.warn('⚠️  MongoDB Notice: Please replace credentials in MONGO_URI.');
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('bufferTimeoutMS', 5000);

    cached.promise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      })
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB Connected`);
        return mongooseInstance;
      })
      .catch((err) => {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        cached.promise = null;
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
