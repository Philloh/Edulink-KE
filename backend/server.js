const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
let isDbConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with proper error handling
const connectDB = async () => {
  try {
    // Prefer cloud connection if provided
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/edulink_kenya';

    // Safer defaults: no buffering + stricter queries
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isDbConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Fallback to in-memory Mongo when external DB is not reachable
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      const uri = mem.getUri('edulink_kenya');
      await mongoose.connect(uri, { dbName: 'edulink_kenya' });
      isDbConnected = true;
      console.log('🧪 Connected to in-memory MongoDB (mongodb-memory-server)');
    } catch (memErr) {
      console.error('❌ In-memory MongoDB fallback failed:', memErr.message);
      console.log('⚠️  Server will continue without database connection');
    }
  }
};

// Database connection status middleware (informational only)
app.use((req, res, next) => {
  if (!isDbConnected) {
    console.log('⚠️  Database not connected, but allowing requests to proceed');
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/schools', require('./routes/schools'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EduLink Kenya API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server AFTER attempting DB connection to avoid buffering timeouts
(async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎯 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`📊 User endpoints: http://localhost:${PORT}/api/users`);
  });
})();
