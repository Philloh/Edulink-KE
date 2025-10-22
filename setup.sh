#!/bin/bash

echo "🚀 Setting up EduLink Kenya..."

# Create backend .env file
echo "📝 Creating backend environment file..."
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edulink_kenya
JWT_SECRET=edulink_kenya_super_secret_jwt_key_2024
NODE_ENV=development
EOF

# Create frontend .env file
echo "📝 Creating frontend environment file..."
cat > frontend/.env << EOF
VITE_API_URL=http://localhost:5000/api
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📦 Installing dependencies..."
npm run install:all

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   npm run dev"
echo ""
echo "Make sure MongoDB is running on your system before starting the application."

