# EduLink Kenya - Complete Setup Guide

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd "/home/iam_ech0/Desktop/Edulink KE"
./setup.sh
```

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
npm run install:all
```

#### 2. Create Environment Files

**Backend Environment (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edulink_kenya
JWT_SECRET=edulink_kenya_super_secret_jwt_key_2024
NODE_ENV=development
```

**Frontend Environment (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

#### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod
```

#### 4. Run the Application
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

## 🔧 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 📱 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🧪 Testing the Setup

### 1. Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### 2. Test User Registration
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "password": "password123",
    "role": "teacher",
    "school": "Test School"
  }'
```

### 3. Test User Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 🎯 User Roles & Features

### Teacher
- Create and manage student progress records
- Upload and share educational resources
- Send messages to parents and students
- View class statistics

### Student  
- View personal academic progress
- Access shared resources and assignments
- Send messages to teachers
- Track attendance and grades

### Parent
- Monitor child's academic progress
- Communicate with teachers
- Access school resources
- Provide feedback on progress

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check MongoDB logs
sudo journalctl -u mongod
```

### Port Already in Use
```bash
# Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📊 Database Schema

### Users Collection
- Personal information (name, email, phone)
- Role-based access (parent, teacher, student)
- School and class information
- Authentication data

### Messages Collection
- Sender and recipient references
- Message content and metadata
- Priority and type classification
- Read status tracking

### Progress Collection
- Student academic records
- Assessment scores and grades
- Attendance tracking
- Teacher comments and parent feedback

### Resources Collection
- Educational materials
- File uploads and links
- Categorization and tagging
- Access control and statistics

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Secure environment variables

## 📱 Mobile Responsiveness

The application is fully responsive with:
- Mobile-first design approach
- Touch-friendly interface
- Responsive navigation
- Optimized layouts for all screen sizes
- Tailwind CSS utility classes

## 🎨 UI/UX Features

- Modern, clean interface
- Consistent color scheme
- Intuitive navigation
- Loading states and error handling
- Toast notifications
- Modal dialogs
- Form validation

## 📈 Performance Optimizations

- Vite for fast development builds
- React lazy loading
- Optimized bundle sizes
- Efficient API calls
- Caching strategies
- Mobile performance

## 🚀 Production Deployment

### Environment Variables
```env
# Backend
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret

# Frontend
VITE_API_URL=https://your-api-domain.com/api
```

### Build Commands
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify MongoDB is running
3. Check environment variables
4. Ensure all dependencies are installed
5. Review the troubleshooting section above

---

**EduLink Kenya** - Connecting parents, teachers, and students for better education outcomes! 🎓

