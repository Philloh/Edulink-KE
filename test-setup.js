#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing EduLink Kenya Setup...\n');

// Check if all required files exist
const requiredFiles = [
  'backend/server.js',
  'backend/package.json',
  'backend/models/User.js',
  'backend/models/Message.js',
  'backend/models/Progress.js',
  'backend/models/Resource.js',
  'backend/routes/users.js',
  'backend/routes/messages.js',
  'backend/routes/progress.js',
  'backend/routes/resources.js',
  'backend/middleware/auth.js',
  'frontend/package.json',
  'frontend/vite.config.js',
  'frontend/tailwind.config.js',
  'frontend/src/App.jsx',
  'frontend/src/main.jsx',
  'frontend/src/index.css',
  'frontend/src/contexts/AuthContext.jsx',
  'frontend/src/services/api.js',
  'frontend/src/components/Layout.jsx',
  'frontend/src/components/Sidebar.jsx',
  'frontend/src/components/Header.jsx',
  'frontend/src/pages/Login.jsx',
  'frontend/src/pages/Register.jsx',
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/Messages.jsx',
  'frontend/src/pages/Progress.jsx',
  'frontend/src/pages/Resources.jsx',
  'frontend/src/pages/Profile.jsx',
  'package.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📦 Checking package.json files...');

// Check package.json files
const packageFiles = [
  'package.json',
  'backend/package.json',
  'frontend/package.json'
];

packageFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ ${file} - Valid JSON`);
    } catch (error) {
      console.log(`❌ ${file} - Invalid JSON`);
      allFilesExist = false;
    }
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n🔧 Checking environment files...');

// Check if environment files exist
const envFiles = [
  'backend/.env',
  'frontend/.env'
];

envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Exists`);
  } else {
    console.log(`⚠️  ${file} - Missing (create manually)`);
  }
});

console.log('\n📋 Setup Summary:');
console.log('================');

if (allFilesExist) {
  console.log('✅ All required files are present!');
  console.log('✅ Project structure is complete!');
  console.log('✅ Ready for development!');
} else {
  console.log('❌ Some files are missing!');
  console.log('❌ Please check the setup guide!');
}

console.log('\n🚀 Next Steps:');
console.log('1. Install Node.js and npm');
console.log('2. Install MongoDB');
console.log('3. Create environment files (.env)');
console.log('4. Install dependencies: npm install');
console.log('5. Start the application: npm run dev');
console.log('\n📖 See COMPLETE_SETUP.md for detailed instructions!');