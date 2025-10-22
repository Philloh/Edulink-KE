const mongoose = require('mongoose');
const User = require('./backend/models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend/.env' });

async function testRegistration() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      bufferCommands: false
    });
    console.log('✅ MongoDB connected successfully!');

    console.log('Testing user creation...');
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test4@example.com',
      password: 'password123',
      role: 'parent',
      phone: '+254712345678',
      school: 'Test School'
    });

    await testUser.save();
    console.log('✅ User created successfully!');
    console.log('User ID:', testUser._id);

    // Clean up - delete the test user
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testRegistration();

