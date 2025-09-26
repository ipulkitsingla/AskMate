#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up AskMate Q&A Application...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js ${nodeVersion} detected`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Create .env file for server if it doesn't exist
const serverEnvPath = path.join(__dirname, 'Server', '.env');
if (!fs.existsSync(serverEnvPath)) {
  const envContent = `PORT=5000
MONGODB_URI=mongodb+srv://singlapulkit1103_db_user:pulkit2005@askmate.31u5zre.mongodb.net/
JWT_SECRET=${generateRandomString(32)}
NODE_ENV=development`;

  fs.writeFileSync(serverEnvPath, envContent);
  console.log('✅ Created .env file for server');
} else {
  console.log('✅ Server .env file already exists');
}

// Install server dependencies
console.log('\n📦 Installing server dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'Server'), stdio: 'inherit' });
  console.log('✅ Server dependencies installed');
} catch (error) {
  console.error('❌ Failed to install server dependencies');
  process.exit(1);
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'FrontEnd'), stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'Server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory already exists');
}

console.log('\n🎉 Setup complete!');
console.log('\nTo start the application:');
console.log('1. Start MongoDB (make sure it\'s running on localhost:27017)');
console.log('2. Start the backend: cd Server && npm run dev');
console.log('3. Start the frontend: cd FrontEnd && npm run dev');
console.log('\nThe application will be available at:');
console.log('- Frontend: http://localhost:5173');
console.log('- Backend: http://localhost:5000');

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
