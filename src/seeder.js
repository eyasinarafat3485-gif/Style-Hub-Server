const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const productsSeed = require('./data/productsSeed');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected for Seeding: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Product.deleteMany();
    await Order.deleteMany();

    console.log('📦 Importing products...');
    const insertedProducts = await Product.insertMany(productsSeed);
    console.log(`✅ ${insertedProducts.length} Products Successfully Seeded!`);

    process.exit();
  } catch (error) {
    console.error(`❌ Error importing data: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    console.log('🧹 Destroying data collections...');
    await Product.deleteMany();
    await Order.deleteMany();

    console.log('✅ Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
