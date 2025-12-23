// ============================================
// Authentication Test Script
// Run: node scripts/test-auth.js
// ============================================

require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const testAuthEndpoints = async () => {
  console.log('🔐 Testing Authentication Endpoints');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health check...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log(`✅ Health: ${healthRes.data.message}`);
    
    // Test 2: Register student
    console.log('\n2️⃣ Testing student registration...');
    const testEmail = `student${Date.now()}@test.com`;
    
    try {
      const registerRes = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Test Student',
        email: testEmail,
        password: 'password123'
      });
      console.log(`✅ Registration: ${registerRes.data.message}`);
      console.log(`   Token: ${registerRes.data.data.token.substring(0, 30)}...`);
    } catch (error) {
      console.log(`❌ Registration failed: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 3: Login student
    console.log('\n3️⃣ Testing student login...');
    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: testEmail,
        password: 'password123'
      });
      console.log(`✅ Login: ${loginRes.data.message}`);
      
      // Test 4: Get current user (with token)
      console.log('\n4️⃣ Testing get current user...');
      const token = loginRes.data.data.token;
      const meRes = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Current user: ${meRes.data.data.user.name}`);
      console.log(`   Role: ${meRes.data.data.user.role}`);
      console.log(`   Email: ${meRes.data.data.user.email}`);
      
    } catch (error) {
      console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 5: Admin login
    console.log('\n5️⃣ Testing admin login...');
    try {
      const adminRes = await axios.post(`${API_BASE}/auth/admin/login`, {
        email: process.env.ADMIN_EMAIL || 'admin@academy.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123'
      });
      console.log(`✅ Admin login: ${adminRes.data.message}`);
      console.log(`   Admin token: ${adminRes.data.data.token.substring(0, 30)}...`);
    } catch (error) {
      console.log(`❌ Admin login failed: ${error.response?.data?.message || error.message}`);
      console.log(`   Using: ${process.env.ADMIN_EMAIL}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Authentication tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure server is running: npm run dev');
  }
};

// Install axios if not already installed
console.log('📦 Installing axios for testing...');
const { execSync } = require('child_process');
try {
  execSync('npm list axios', { stdio: 'ignore' });
} catch {
  execSync('npm install axios', { stdio: 'inherit' });
}

testAuthEndpoints();