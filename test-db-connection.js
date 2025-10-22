#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/edulink_kenya';
    console.log(`📡 Attempting to connect to: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Database connection successful!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Suggestions:');
      console.log('   1. Make sure MongoDB is running locally');
      console.log('   2. Check your MONGODB_URI environment variable');
      console.log('   3. Verify network connectivity to MongoDB server');
    }
    
    process.exit(1);
  }
}

testConnection();
