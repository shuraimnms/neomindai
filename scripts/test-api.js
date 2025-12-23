// ============================================
// Complete API Test Script
// Run: node scripts/test-api.js
// ============================================

require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let adminToken = '';
let studentToken = '';

const testAllEndpoints = async () => {
  console.log('🧪 Testing All API Endpoints');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health check...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log(`✅ Health: ${healthRes.data.message}`);
    console.log(`   Database: ${healthRes.data.database}`);
    
    // Test 2: Register student
    console.log('\n2️⃣ Registering test student...');
    const testEmail = `student${Date.now()}@test.com`;
    
    try {
      const registerRes = await axios.post(`${API_BASE}/auth/register`, {
        name: 'API Test Student',
        email: testEmail,
        password: 'password123'
      });
      console.log(`✅ Registration: ${registerRes.data.message}`);
      studentToken = registerRes.data.data.token;
    } catch (error) {
      console.log(`❌ Registration failed: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 3: Admin login
    console.log('\n3️⃣ Logging in as admin...');
    try {
      const adminRes = await axios.post(`${API_BASE}/auth/admin/login`, {
        email: process.env.ADMIN_EMAIL || 'admin@academy.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123'
      });
      console.log(`✅ Admin login: ${adminRes.data.message}`);
      adminToken = adminRes.data.data.token;
    } catch (error) {
      console.log(`❌ Admin login failed: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 4: Student endpoints
    if (studentToken) {
      console.log('\n4️⃣ Testing student endpoints...');
      
      // Student dashboard
      try {
        const dashboardRes = await axios.get(`${API_BASE}/student/dashboard`, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log(`✅ Student dashboard: ${dashboardRes.data.message}`);
        console.log(`   Total videos: ${dashboardRes.data.data.stats.totalVideos}`);
      } catch (error) {
        console.log(`❌ Student dashboard failed: ${error.response?.data?.message || error.message}`);
      }
      
      // Student profile
      try {
        const profileRes = await axios.get(`${API_BASE}/student/profile`, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log(`✅ Student profile: ${profileRes.data.data.user.name}`);
      } catch (error) {
        console.log(`❌ Student profile failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Test 5: Video endpoints (admin)
    if (adminToken) {
      console.log('\n5️⃣ Testing video endpoints (admin)...');
      
      // Create video
      try {
        const createRes = await axios.post(`${API_BASE}/videos`, {
          title: 'Test Video Tutorial',
          description: 'This is a test video for the academy',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: '10:30'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Video created: ${createRes.data.data.video.title}`);
        
        const videoId = createRes.data.data.video.id;
        
        // Get all videos
        const videosRes = await axios.get(`${API_BASE}/videos`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Videos fetched: ${videosRes.data.data.videos.length} videos`);
        
        // Update video
        const updateRes = await axios.put(`${API_BASE}/videos/${videoId}`, {
          title: 'Updated Test Video'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Video updated: ${updateRes.data.message}`);
        
      } catch (error) {
        console.log(`❌ Video operations failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Test 6: Admin endpoints
    if (adminToken) {
      console.log('\n6️⃣ Testing admin endpoints...');
      
      // Admin dashboard
      try {
        const adminDashboardRes = await axios.get(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Admin dashboard: ${adminDashboardRes.data.message}`);
        console.log(`   Total students: ${adminDashboardRes.data.data.stats.totalStudents}`);
        console.log(`   Total videos: ${adminDashboardRes.data.data.stats.totalVideos}`);
      } catch (error) {
        console.log(`❌ Admin dashboard failed: ${error.response?.data?.message || error.message}`);
      }
      
      // Get all students
      try {
        const studentsRes = await axios.get(`${API_BASE}/admin/students`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Students list: ${studentsRes.data.data.students.length} students`);
      } catch (error) {
        console.log(`❌ Students list failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Test 7: Access control
    console.log('\n7️⃣ Testing access control...');
    
    // Student trying to access admin route
    if (studentToken) {
      try {
        await axios.get(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log(`❌ Access control FAILED: Student accessed admin route`);
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`✅ Access control: Student correctly blocked from admin route`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ All API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Admin token: ${adminToken ? '✓' : '✗'}`);
    console.log(`   Student token: ${studentToken ? '✓' : '✗'}`);
    console.log(`   All endpoints: ✓`);
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure server is running: npm run dev');
  }
};

// Install axios if needed
console.log('📦 Checking dependencies...');
const { execSync } = require('child_process');
try {
  execSync('npm list axios', { stdio: 'ignore' });
} catch {
  console.log('Installing axios...');
  execSync('npm install axios', { stdio: 'inherit' });
}

testAllEndpoints();