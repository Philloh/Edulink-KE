#!/bin/bash

echo "🔧 Creating environment files for EduLink Kenya..."

# Create backend .env file
echo "📝 Creating backend/.env..."
cat > backend/.env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edulink_kenya
JWT_SECRET=edulink_kenya_super_secret_jwt_key_2024
NODE_ENV=development
EOF

# Create frontend .env file
echo "📝 Creating frontend/.env..."
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📋 Environment files created:"
echo "   - backend/.env"
echo "   - frontend/.env"
echo ""
echo "🚀 You can now run the application!"
