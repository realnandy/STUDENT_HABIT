const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    // If no URI or default URI and we want to ensure it runs
    if (!mongoUri || mongoUri === 'mongodb://localhost:27017/student_task_manager') {
      try {
        console.log('Attempting to connect to local MongoDB...');
        await mongoose.connect(mongoUri || 'mongodb://localhost:27017/student_task_manager', {
          serverSelectionTimeoutMS: 2000 // Fast fail
        });
        console.log('Connected to local MongoDB');
        return;
      } catch (err) {
        console.log('Local MongoDB not found. Starting in-memory database for demonstration...');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log('In-memory MongoDB started');
      }
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

